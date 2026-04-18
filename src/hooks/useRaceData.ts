import { useState, useEffect, useRef, useCallback } from 'react';
import type { Driver, RaceInfo, ConnectionStatus, KartStyle, KartStats, SavedDriver } from '../types';

interface UseRaceDataReturn {
  drivers: Driver[];
  raceInfo: RaceInfo;
  connectionStatus: ConnectionStatus;
  debugLog: string[];
  kartStyles: Map<string, KartStyle>;
  kartStats: KartStats[];
  savedDrivers: SavedDriver[];
}

export const TRACKS = {
  MAX60: { name: 'Max60', websocket: 'wss://www.apex-timing.com:9703/', id: 'max60' },
  SLOVAKIARING: { name: 'Slovakiaring', websocket: 'wss://www.apex-timing.com:8533/', id: 'slovakiaring' },
  CLASSICGP: { name: 'Classic GP', websocket: 'wss://www.apex-timing.com:10063/', id: 'classicgp' }
} as const;

export type TrackId = typeof TRACKS[keyof typeof TRACKS]['id'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api`;

const parseCssString = (css: string): KartStyle => {
  const borderMatch = css.match(/border-bottom-color:\s*([^;!]+)/i);
  const colorMatch = css.match(/(?:^|;)\s*color:\s*([^;!]+)/i);
  
  return {
    borderBottomColor: borderMatch ? borderMatch[1].trim() : '#333',
    color: colorMatch ? colorMatch[1].trim() : '#FFF',
  };
};

const parseLapTimeToMs = (timeStr: string): number => {
  if (!timeStr || timeStr === '-') return Infinity;
  
  // Handle MM:SS.mmm or SS.mmm format
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return (minutes * 60 + seconds) * 1000;
  }
  
  const seconds = parseFloat(timeStr);
  if (isNaN(seconds)) return Infinity;
  return seconds * 1000;
};

const MIN_VALID_LAP_MS = 50_000;
const DUPLICATE_LAP_WINDOW_MS = 45_000;

const isValidRankingLap = (timeStr: string): boolean => {
  const ms = parseLapTimeToMs(timeStr);
  return Number.isFinite(ms) && ms >= MIN_VALID_LAP_MS;
};

const isPitStatusClass = (statusClass: string): boolean => {
  return statusClass === 'si' || statusClass === 'so';
};

const getSlovakiaringRankingLap = (driver: Driver): string => {
  if (isValidRankingLap(driver.bestLap)) return driver.bestLap;
  if (!driver.isPitOut && driver.onTrackClass !== 'to' && isValidRankingLap(driver.onTrack)) return driver.onTrack;
  if (isValidRankingLap(driver.lastLap)) return driver.lastLap;
  return '';
};

const extractNationality = (value: string, cssClass: string): string => {
  const trimmedValue = value?.trim() || '';
  if (trimmedValue) return trimmedValue;

  const classMatch = cssClass?.match(/\b([A-Z]{2,3})\b\s+nat\b/);
  if (classMatch) return classMatch[1];

  return '';
};

export const useRaceData = (trackId: TrackId = 'max60'): UseRaceDataReturn => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [raceInfo, setRaceInfo] = useState<RaceInfo>({
    title1: '',
    title2: '',
    track: '',
    message: '',
    countdown: 0,
    lightStatus: '',
    comments: '',
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [kartStyles, setKartStyles] = useState<Map<string, KartStyle>>(new Map());
  const [kartStats, setKartStats] = useState<KartStats[]>([]);
  const [savedDrivers, setSavedDrivers] = useState<SavedDriver[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const driversMapRef = useRef<Map<string, Driver>>(new Map());
  const kartStylesRef = useRef<Map<string, KartStyle>>(new Map());
  const kartStatsRef = useRef<Map<string, KartStats>>(new Map());
  const lastPersistedLapRef = useRef<Map<string, { lapTimeMs: number; timestamp: number }>>(new Map());

  const addDebugLog = useCallback((msg: string) => {
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const getRankingLapValue = useCallback((driver: Driver): string => {
    return trackId === 'slovakiaring' ? getSlovakiaringRankingLap(driver) : driver.bestLap;
  }, [trackId]);

  const updateKartStats = useCallback(() => {
    const statsArray = Array.from(kartStatsRef.current.values())
      .filter(stat => stat.bestLapTime !== Infinity)
      .sort((a, b) => a.bestLapTime - b.bestLapTime);
    setKartStats(statsArray);
  }, []);

  const sendLapTimeToServer = useCallback(async (kartNumber: string, kartClass: string, timeMs: number, timeDisplay: string, driverName: string) => {
    try {
      await fetch(`${API_BASE}/lap-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kartNumber,
          kartClass,
          timeMs: Math.round(timeMs),
          timeDisplay,
          driverName,
          trackId
        })
      });
    } catch (error) {
      console.error('Failed to send lap time to server:', error);
    }
  }, [trackId]);

  const recordKartLapTime = useCallback((kartNumber: string, kartClass: string, lapTimeStr: string, driverName: string) => {
    if (!kartNumber || !lapTimeStr || lapTimeStr === '-') return;
    
    const lapTimeMs = parseLapTimeToMs(lapTimeStr);
    if (lapTimeMs === Infinity) return;

    const now = Date.now();
    const previousLap = lastPersistedLapRef.current.get(kartNumber);
    const isDuplicateLap = previousLap
      && previousLap.lapTimeMs === lapTimeMs
      && now - previousLap.timestamp < DUPLICATE_LAP_WINDOW_MS;

    if (isDuplicateLap) return;

    lastPersistedLapRef.current.set(kartNumber, { lapTimeMs, timestamp: now });
    
    sendLapTimeToServer(kartNumber, kartClass, lapTimeMs, lapTimeStr, driverName);
    
    let stats = kartStatsRef.current.get(kartNumber);
    
    if (!stats) {
      stats = {
        kartNumber,
        kartClass,
        bestLapTime: lapTimeMs,
        bestLapDisplay: lapTimeStr,
        allLapTimes: [lapTimeMs],
        lapCount: 1,
        averageLapTime: lapTimeMs,
        lastDriver: driverName,
        bestLapDriver: driverName,
      };
    } else {
      const lastTime = stats.allLapTimes[stats.allLapTimes.length - 1];
      if (lastTime !== lapTimeMs) {
        stats.allLapTimes.push(lapTimeMs);
        stats.lapCount = stats.allLapTimes.length;
        stats.averageLapTime = stats.allLapTimes.reduce((a, b) => a + b, 0) / stats.lapCount;
        
        if (lapTimeMs < stats.bestLapTime) {
          stats.bestLapTime = lapTimeMs;
          stats.bestLapDisplay = lapTimeStr;
          stats.bestLapDriver = driverName;
        }
      }
      stats.kartClass = kartClass || stats.kartClass;
      stats.lastDriver = driverName || stats.lastDriver;
    }
    
    kartStatsRef.current.set(kartNumber, stats);
    updateKartStats();
  }, [updateKartStats, sendLapTimeToServer]);

  const updateDriversList = useCallback(() => {
    const sorted = Array.from(driversMapRef.current.values())
      .sort((a, b) => a.position - b.position);
    setDrivers([...sorted]);
  }, []);

  const parseGrid = useCallback((html: string) => {
    const wrappedHtml = `<table>${html}</table>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(wrappedHtml, 'text/html');
    const rows = doc.querySelectorAll('tr[data-id]');
    const isSlovakiaring = trackId === 'slovakiaring';
    const isClassicGp = trackId === 'classicgp';
    
    addDebugLog(`Found ${rows.length} rows`);
    
    const newDrivers: Driver[] = [];
    
    rows.forEach(row => {
      const id = row.getAttribute('data-id');
      if (!id || id === 'r0') return; // Skip header row
      
      const getCell = (colNum: number) => {
        // First try direct data-id match
        let cell = row.querySelector(`[data-id="${id}c${colNum}"]`);
        if (!cell) {
          // For kart number, look inside .no div
          const noDiv = row.querySelector(`.no div[data-id="${id}c${colNum}"]`);
          if (noDiv) return noDiv.textContent?.trim() || '';
          // For rank, look inside .rk p
          const rkP = row.querySelector(`.rk p[data-id="${id}c${colNum}"]`);
          if (rkP) return rkP.textContent?.trim() || '';
        }
        return cell?.textContent?.trim() || '';
      };
      
      const getCellClass = (colNum: number) => {
        let cell = row.querySelector(`[data-id="${id}c${colNum}"]`);
        return cell?.className || '';
      };
      
      // Get kart class from the div inside .no td
      const kartDiv = row.querySelector(`.no div[data-id="${id}c5"]`);
      const kartClass = kartDiv?.className || '';
      
      const slovakiaringNationality = extractNationality(getCell(4), getCellClass(4));

      const driver: Driver = {
        id,
        position: parseInt(row.getAttribute('data-pos') || '0'),
        group: '',
        groupClass: getCellClass(1),
        status: '',
        statusClass: getCellClass(2),
        rank: getCell(3),
        rankClass: getCellClass(3),
        kartNumber: isSlovakiaring ? getCell(5) : getCell(4),
        kartClass: kartClass,
        name: isSlovakiaring ? getCell(6) : getCell(5),
        nationality: isClassicGp ? getCell(6) : isSlovakiaring ? slovakiaringNationality : '',
        nationalityClass: isClassicGp ? getCellClass(6) : isSlovakiaring ? getCellClass(4) : '',
        gap: isClassicGp ? getCell(8) : isSlovakiaring ? getCell(12) : '',
        gapClass: isClassicGp ? getCellClass(8) : isSlovakiaring ? getCellClass(12) : '',
        onTrack: isSlovakiaring ? getCell(15) : '',
        onTrackClass: isSlovakiaring ? getCellClass(15) : '',
        pits: isSlovakiaring ? getCell(16) : '',
        pitsClass: isSlovakiaring ? getCellClass(16) : '',
        sector1: isClassicGp ? '' : isSlovakiaring ? getCell(7) : getCell(6),
        sector1Class: isClassicGp ? '' : isSlovakiaring ? getCellClass(7) : getCellClass(6),
        sector2: isClassicGp ? '' : isSlovakiaring ? getCell(8) : getCell(7),
        sector2Class: isClassicGp ? '' : isSlovakiaring ? getCellClass(8) : getCellClass(7),
        sector3: isClassicGp ? '' : isSlovakiaring ? getCell(9) : getCell(8),
        sector3Class: isClassicGp ? '' : isSlovakiaring ? getCellClass(9) : getCellClass(8),
        laps: isClassicGp ? getCell(10) : isSlovakiaring ? getCell(11) : getCell(9),
        lapsClass: isClassicGp ? getCellClass(10) : isSlovakiaring ? getCellClass(11) : getCellClass(9),
        lastLap: isClassicGp ? getCell(9) : isSlovakiaring ? getCell(10) : getCell(10),
        lastLapClass: isClassicGp ? getCellClass(9) : isSlovakiaring ? getCellClass(10) : getCellClass(10),
        bestLap: isClassicGp ? getCell(7) : isSlovakiaring ? getCell(14) : getCell(11),
        bestLapClass: isClassicGp ? getCellClass(7) : isSlovakiaring ? getCellClass(14) : getCellClass(11),
        isPitOut: isSlovakiaring ? getCellClass(15) === 'to' : false,
        flashEffect: false,
        flashType: '',
      };

      if (isSlovakiaring && driver.isPitOut) {
        driver.status = 'PIT/OUT';
        driver.statusClass = 'to';
      }
      
      // For Slovakiaring the reliable measured time is in lastLap, not bestLap.
      const rankingLapValue = getRankingLapValue(driver);
      if (driver.kartNumber && rankingLapValue) {
        recordKartLapTime(driver.kartNumber, driver.kartClass, rankingLapValue, driver.name);
      }
      
      newDrivers.push(driver);
      driversMapRef.current.set(id, driver);
    });
    
    addDebugLog(`Parsed ${newDrivers.length} drivers`);
    newDrivers.sort((a, b) => a.position - b.position);
    setDrivers(newDrivers);
  }, [addDebugLog, recordKartLapTime, getRankingLapValue]);

  const updateCell = useCallback((msg: string) => {
    // Format: r42c8|tn|11.125 or r42c2|sr|
    const match = msg.match(/^(r\d+)(c\d+)\|([^|]*)\|?(.*)$/);
    if (!match) return;
    
    const [, driverId, cellId, cssClass, value] = match;
    const driver = driversMapRef.current.get(driverId);
    if (!driver) return;
    
    const cellNum = parseInt(cellId.replace('c', ''));
    const isSlovakiaring = trackId === 'slovakiaring';
    const isClassicGp = trackId === 'classicgp';
    
    if (isClassicGp) {
      switch (cellNum) {
        case 1:
          driver.groupClass = cssClass;
          break;
        case 2:
          driver.statusClass = cssClass;
          if (isPitStatusClass(cssClass)) {
            driver.isPitOut = true;
            driver.status = 'PIT/OUT';
          }
          break;
        case 3:
          driver.rank = value || driver.rank;
          driver.rankClass = cssClass;
          break;
        case 4:
          driver.kartNumber = value || driver.kartNumber;
          driver.kartClass = cssClass || driver.kartClass;
          break;
        case 5:
          driver.name = value || driver.name;
          break;
        case 6:
          driver.nationality = value;
          driver.nationalityClass = cssClass;
          break;
        case 7:
          driver.bestLap = value;
          driver.bestLapClass = cssClass;
          if (driver.kartNumber && value) {
            recordKartLapTime(driver.kartNumber, driver.kartClass, value, driver.name);
          }
          break;
        case 8:
          driver.gap = value;
          driver.gapClass = cssClass;
          break;
        case 9:
          driver.lastLap = value;
          driver.lastLapClass = cssClass;
          break;
        case 10:
          driver.laps = value || driver.laps;
          driver.lapsClass = cssClass;
          break;
      }
    } else if (isSlovakiaring) {
      switch (cellNum) {
        case 1:
          driver.groupClass = cssClass;
          break;
        case 2:
          driver.statusClass = cssClass;
          break;
        case 3:
          driver.rank = value || driver.rank;
          driver.rankClass = cssClass;
          break;
        case 4:
          driver.nationality = extractNationality(value, cssClass) || driver.nationality;
          driver.nationalityClass = cssClass;
          break;
        case 5:
          driver.kartNumber = value || driver.kartNumber;
          driver.kartClass = cssClass || driver.kartClass;
          break;
        case 6:
          driver.name = value || driver.name;
          break;
        case 7:
          driver.sector1 = value;
          driver.sector1Class = cssClass;
          break;
        case 8:
          driver.sector2 = value;
          driver.sector2Class = cssClass;
          break;
        case 9:
          driver.sector3 = value;
          driver.sector3Class = cssClass;
          break;
        case 10:
          driver.lastLap = value;
          driver.lastLapClass = cssClass;
          if (driver.kartNumber) {
            const rankingLapValue = getRankingLapValue(driver);
            if (rankingLapValue) {
              recordKartLapTime(driver.kartNumber, driver.kartClass, rankingLapValue, driver.name);
            }
          }
          break;
        case 11:
          driver.laps = value || driver.laps;
          driver.lapsClass = cssClass;
          break;
        case 12:
          driver.gap = value;
          driver.gapClass = cssClass;
          break;
        case 13:
          // Interval column for Slovakiaring, currently not shown in UI.
          break;
        case 14:
          driver.bestLap = value;
          driver.bestLapClass = cssClass;
          if (driver.kartNumber) {
            const rankingLapValue = getRankingLapValue(driver);
            if (rankingLapValue) {
              recordKartLapTime(driver.kartNumber, driver.kartClass, rankingLapValue, driver.name);
            }
          }
          break;
        case 15:
          driver.onTrack = value;
          driver.onTrackClass = cssClass;
          if (cssClass === 'to') {
            driver.isPitOut = true;
          } else if (cssClass === 'in') {
            driver.isPitOut = false;
          }
          if (driver.kartNumber) {
            const rankingLapValue = getRankingLapValue(driver);
            if (rankingLapValue) {
              recordKartLapTime(driver.kartNumber, driver.kartClass, rankingLapValue, driver.name);
            }
          }
          if (cssClass === 'to') {
            driver.status = 'PIT/OUT';
            driver.statusClass = 'to';
          } else if (value) {
            driver.status = 'Pályán';
            driver.statusClass = cssClass || 'in';
          }
          break;
        case 16:
          driver.pits = value;
          driver.pitsClass = cssClass;
          if (value) {
            driver.status = 'Boxban';
            driver.statusClass = cssClass || 'pit';
          }
          break;
      }
    } else {
      switch (cellNum) {
        case 1:
          driver.groupClass = cssClass;
          break;
        case 2:
          driver.statusClass = cssClass;
          break;
        case 3:
          driver.rank = value || driver.rank;
          driver.rankClass = cssClass;
          break;
        case 4:
          driver.kartNumber = value || driver.kartNumber;
          driver.kartClass = cssClass || driver.kartClass;
          break;
        case 5:
          driver.name = value || driver.name;
          break;
        case 6:
          driver.sector1 = value;
          driver.sector1Class = cssClass;
          break;
        case 7:
          driver.sector2 = value;
          driver.sector2Class = cssClass;
          break;
        case 8:
          driver.sector3 = value;
          driver.sector3Class = cssClass;
          break;
        case 9:
          driver.laps = value || driver.laps;
          driver.lapsClass = cssClass;
          break;
        case 10:
          driver.lastLap = value;
          driver.lastLapClass = cssClass;
          break;
        case 11:
          driver.bestLap = value;
          driver.bestLapClass = cssClass;
          // Record new best lap time for this kart
          if (driver.kartNumber && value) {
            recordKartLapTime(driver.kartNumber, driver.kartClass, value, driver.name);
          }
          break;
      }
    }
    
    updateDriversList();
  }, [updateDriversList, recordKartLapTime, getRankingLapValue]);

  const updatePosition = useCallback((msg: string) => {
    const match = msg.match(/^(r\d+)\|#\|(\d+)$/);
    if (!match) return;
    
    const [, driverId, newPos] = match;
    const driver = driversMapRef.current.get(driverId);
    if (!driver) return;
    
    driver.position = parseInt(newPos);
    updateDriversList();
  }, [updateDriversList]);

  const triggerFlash = useCallback((msg: string) => {
    // Format: r42|*|39422|13700 or r27|*i1|14711
    const match = msg.match(/^(r\d+)\|\*([^|]*)\|/);
    if (!match) return;
    
    const driverId = match[1];
    const flashType = match[2] || ''; // '', 'i1', 'i2', 'i3'
    const driver = driversMapRef.current.get(driverId);
    if (!driver) return;

    if (trackId === 'slovakiaring') {
      if (flashType === 'in') {
        driver.isPitOut = true;
        driver.status = 'PIT/OUT';
        driver.statusClass = 'to';
      } else if (flashType === 'out') {
        driver.isPitOut = false;
        if (driver.statusClass === 'to') {
          driver.status = 'Pályán';
          driver.statusClass = 'in';
        }
      }
    }
    
    driver.flashEffect = true;
    driver.flashType = flashType;
    updateDriversList();
    
    setTimeout(() => {
      driver.flashEffect = false;
      driver.flashType = '';
      updateDriversList();
    }, 1000);
  }, [updateDriversList, trackId]);

  const processMessages = useCallback((data: string) => {
    const messages = data.split('\n').filter(msg => msg.trim());
    
    messages.forEach(msg => {
      const parts = msg.split('|');
      
      if (msg.startsWith('init|')) {
        addDebugLog('Init received - clearing data');
        driversMapRef.current.clear();
        setDrivers([]);
      } else if (msg.startsWith('css|')) {
        // Parse CSS definitions: css|no1|border-bottom-color:#FF00FF !important; color:#FFFFFF !important;
        const className = parts[1];
        const cssValue = parts.slice(2).join('|');
        if (className && cssValue) {
          const style = parseCssString(cssValue);
          kartStylesRef.current.set(className, style);
          setKartStyles(new Map(kartStylesRef.current));
        }
      } else if (msg.startsWith('title1||')) {
        setRaceInfo(prev => ({ ...prev, title1: parts[2] || '' }));
      } else if (msg.startsWith('title2||')) {
        const title = parts.slice(2).join('|');
        setRaceInfo(prev => ({ ...prev, title2: title }));
        addDebugLog(`Title: ${title}`);
      } else if (msg.startsWith('track||')) {
        const trackName = parts.slice(2).join('|');
        setRaceInfo(prev => ({ ...prev, track: trackName }));
        addDebugLog(`Track: ${trackName}`);
      } else if (msg.startsWith('msg||')) {
        setRaceInfo(prev => ({ ...prev, message: parts.slice(2).join('|') }));
      } else if (msg.startsWith('dyn1|countdown|')) {
        const countdown = parseInt(parts[2]) || 0;
        setRaceInfo(prev => ({ ...prev, countdown }));
      } else if (msg.startsWith('light|')) {
        setRaceInfo(prev => ({ ...prev, lightStatus: parts[1] || '' }));
      } else if (msg.startsWith('com||')) {
        setRaceInfo(prev => ({ ...prev, comments: parts.slice(2).join('|') }));
      } else if (msg.startsWith('grid||')) {
        const html = parts.slice(2).join('|');
        addDebugLog(`Grid received, length: ${html.length}`);
        parseGrid(html);
      } else if (msg.match(/^r\d+c\d+\|/)) {
        updateCell(msg);
      } else if (msg.match(/^r\d+\|#\|/)) {
        updatePosition(msg);
      } else if (msg.match(/^r\d+\|\*[^|]*\|/)) {
        triggerFlash(msg);
      }
    });
  }, [addDebugLog, parseGrid, updateCell, updatePosition, triggerFlash]);

  useEffect(() => {
    const loadKartStatsFromServer = async () => {
      try {
        const response = await fetch(`${API_BASE}/kart-stats?trackId=${trackId}`);
        if (response.ok) {
          const serverStats = await response.json();
          serverStats.forEach((stat: any) => {
            kartStatsRef.current.set(stat.kartNumber, {
              kartNumber: stat.kartNumber,
              kartClass: stat.kartClass || '',
              bestLapTime: stat.bestLapTime,
              bestLapDisplay: stat.bestLapDisplay,
              allLapTimes: [stat.bestLapTime],
              lapCount: stat.lapCount,
              averageLapTime: stat.bestLapTime,
              lastDriver: stat.bestLapDriver,
              bestLapDriver: stat.bestLapDriver,
            });
          });
          updateKartStats();
          addDebugLog(`Loaded ${serverStats.length} kart stats from server`);
        }
      } catch (error) {
        console.error('Failed to load kart stats from server:', error);
        addDebugLog('Failed to load kart stats from server');
      }
    };

    loadKartStatsFromServer();
  }, [addDebugLog, updateKartStats, trackId]);

  // Fetch all saved drivers from database
  useEffect(() => {
    const loadSavedDrivers = async () => {
      try {
        const response = await fetch(`${API_BASE}/drivers?trackId=${trackId}`);
        if (response.ok) {
          const drivers = await response.json();
          setSavedDrivers(drivers);
          addDebugLog(`Loaded ${drivers.length} saved drivers from server`);
        }
      } catch (error) {
        console.error('Failed to load saved drivers:', error);
      }
    };

    loadSavedDrivers();
    // Refresh saved drivers every 30 seconds
    const interval = setInterval(loadSavedDrivers, 30000);
    return () => clearInterval(interval);
  }, [addDebugLog, trackId]);

  useEffect(() => {
    // Clear all data when switching tracks
    driversMapRef.current.clear();
    setDrivers([]);
    kartStylesRef.current.clear();
    setKartStyles(new Map());
    kartStatsRef.current.clear();
    lastPersistedLapRef.current.clear();
    setKartStats([]);
    setRaceInfo({
      title1: '',
      title2: '',
      track: '',
      message: '',
      countdown: 0,
      lightStatus: '',
      comments: '',
    });
    addDebugLog(`Switching to track: ${trackId}`);

    const selectedTrack = Object.values(TRACKS).find(t => t.id === trackId) || TRACKS.MAX60;
    const ws = new WebSocket(selectedTrack.websocket);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected to ${selectedTrack.name}`);
      setConnectionStatus('connected');
      addDebugLog(`Connected to ${selectedTrack.name}`);
    };

    ws.onmessage = (event) => {
      const data = event.data as string;
      console.log('Received:', data.substring(0, 200));
      processMessages(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addDebugLog('WebSocket error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      addDebugLog('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [addDebugLog, processMessages, trackId]);

  return {
    drivers,
    raceInfo,
    connectionStatus,
    debugLog,
    kartStyles,
    kartStats,
    savedDrivers,
  };
};

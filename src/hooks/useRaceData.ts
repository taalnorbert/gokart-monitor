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

const WEBSOCKET_URL = 'wss://www.apex-timing.com:9703/';
const API_URL = 'http://localhost:3001/api';

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

export const useRaceData = (): UseRaceDataReturn => {
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

  const addDebugLog = useCallback((msg: string) => {
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const updateKartStats = useCallback(() => {
    const statsArray = Array.from(kartStatsRef.current.values())
      .filter(stat => stat.bestLapTime !== Infinity)
      .sort((a, b) => a.bestLapTime - b.bestLapTime);
    setKartStats(statsArray);
  }, []);

  const sendLapTimeToServer = useCallback(async (kartNumber: string, kartClass: string, timeMs: number, timeDisplay: string, driverName: string) => {
    try {
      await fetch(`${API_URL}/lap-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kartNumber,
          kartClass,
          timeMs: Math.round(timeMs),
          timeDisplay,
          driverName
        })
      });
    } catch (error) {
      console.error('Failed to send lap time to server:', error);
    }
  }, []);

  const recordKartLapTime = useCallback((kartNumber: string, kartClass: string, lapTimeStr: string, driverName: string) => {
    if (!kartNumber || !lapTimeStr || lapTimeStr === '-') return;
    
    const lapTimeMs = parseLapTimeToMs(lapTimeStr);
    if (lapTimeMs === Infinity) return;
    
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
      const kartDiv = row.querySelector(`.no div[data-id="${id}c4"]`);
      const kartClass = kartDiv?.className || '';
      
      const driver: Driver = {
        id,
        position: parseInt(row.getAttribute('data-pos') || '0'),
        group: '',
        groupClass: getCellClass(1),
        status: '',
        statusClass: getCellClass(2),
        rank: getCell(3),
        rankClass: getCellClass(3),
        kartNumber: getCell(4),
        kartClass: kartClass,
        name: getCell(5),
        sector1: getCell(6),
        sector1Class: getCellClass(6),
        sector2: getCell(7),
        sector2Class: getCellClass(7),
        sector3: getCell(8),
        sector3Class: getCellClass(8),
        laps: getCell(9),
        lapsClass: getCellClass(9),
        lastLap: getCell(10),
        lastLapClass: getCellClass(10),
        bestLap: getCell(11),
        bestLapClass: getCellClass(11),
        flashEffect: false,
        flashType: '',
      };
      
      // Record kart lap time for statistics
      if (driver.kartNumber && driver.bestLap) {
        recordKartLapTime(driver.kartNumber, driver.kartClass, driver.bestLap, driver.name);
      }
      
      newDrivers.push(driver);
      driversMapRef.current.set(id, driver);
    });
    
    addDebugLog(`Parsed ${newDrivers.length} drivers`);
    newDrivers.sort((a, b) => a.position - b.position);
    setDrivers(newDrivers);
  }, [addDebugLog, recordKartLapTime]);

  const updateCell = useCallback((msg: string) => {
    // Format: r42c8|tn|11.125 or r42c2|sr|
    const match = msg.match(/^(r\d+)(c\d+)\|([^|]*)\|?(.*)$/);
    if (!match) return;
    
    const [, driverId, cellId, cssClass, value] = match;
    const driver = driversMapRef.current.get(driverId);
    if (!driver) return;
    
    const cellNum = parseInt(cellId.replace('c', ''));
    
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
    
    updateDriversList();
  }, [updateDriversList, recordKartLapTime]);

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
    
    driver.flashEffect = true;
    driver.flashType = flashType;
    updateDriversList();
    
    setTimeout(() => {
      driver.flashEffect = false;
      driver.flashType = '';
      updateDriversList();
    }, 1000);
  }, [updateDriversList]);

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
        const response = await fetch(`${API_URL}/kart-stats`);
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
  }, [addDebugLog, updateKartStats]);

  // Fetch all saved drivers from database
  useEffect(() => {
    const loadSavedDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/drivers`);
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
  }, [addDebugLog]);

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      addDebugLog('WebSocket connected');
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
  }, [addDebugLog, processMessages]);

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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, MessageBanner, Leaderboard, KartRankings, Legend, DriverTracker, Modal } from './components';
import { TRACKS, useRaceData, type TrackId } from './hooks/useRaceData';
import './styles/global.css';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api`;

type PitHistoryEntry = {
  enteredAtDisplay: string;
  enteredAtMs: number;
};

const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>(() => {
    const savedTrack = localStorage.getItem('selectedTrack');
    return (Object.values(TRACKS).some(track => track.id === savedTrack) ? savedTrack : 'max60') as TrackId;
  });
  const [showTrackPicker, setShowTrackPicker] = useState(true);
  const { drivers, raceInfo, connectionStatus, kartStyles, kartStats, savedDrivers } = useRaceData(selectedTrack);
  const [followedDriver, setFollowedDriver] = useState<string | null>(null);
  const [pitHistoryByKart, setPitHistoryByKart] = useState<Map<string, PitHistoryEntry>>(new Map());

  useEffect(() => {
    setShowTrackPicker(true);
  }, []);

  const currentTrack = useMemo(
    () => Object.values(TRACKS).find(track => track.id === selectedTrack) || TRACKS.MAX60,
    [selectedTrack]
  );

  const activeKarts = useMemo(() => {
    if (selectedTrack === 'slovakiaring') {
      const pitHistoryKarts = new Set(pitHistoryByKart.keys());
      return new Set(
        drivers
          .filter(driver => !driver.isPitOut && driver.onTrackClass !== 'to' && !pitHistoryKarts.has(driver.kartNumber))
          .map(driver => driver.kartNumber)
      );
    }

    return new Set(drivers.map(driver => driver.kartNumber));
  }, [drivers, selectedTrack, pitHistoryByKart]);

  const formatPitEntryTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  const savePitEntryToServer = useCallback(async (kartNumber: string, enteredAtIso: string) => {
    try {
      await fetch(`${API_BASE}/pit-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kartNumber,
          trackId: selectedTrack,
          enteredAt: enteredAtIso
        })
      });
    } catch (error) {
      console.error('Failed to save pit entry:', error);
    }
  }, [selectedTrack]);

  useEffect(() => {
    const loadPitHistory = async () => {
      try {
        const response = await fetch(`${API_BASE}/pit-history?trackId=${selectedTrack}`);
        if (!response.ok) return;

        const pitEntries: Array<{ kartNumber: string; enteredAt: string }> = await response.json();
        const next = new Map<string, PitHistoryEntry>();

        pitEntries.forEach(entry => {
          const enteredAt = new Date(entry.enteredAt);
          if (!Number.isNaN(enteredAt.getTime())) {
            next.set(entry.kartNumber, {
              enteredAtDisplay: formatPitEntryTime(enteredAt),
              enteredAtMs: enteredAt.getTime()
            });
          }
        });

        setPitHistoryByKart(next);
      } catch (error) {
        console.error('Failed to load pit history:', error);
      }
    };

    loadPitHistory();
  }, [selectedTrack, formatPitEntryTime]);

  useEffect(() => {
    if (selectedTrack !== 'slovakiaring') return;

    setPitHistoryByKart(prev => {
      const next = new Map(prev);
      let changed = false;

      drivers.forEach(driver => {
        if (!driver.kartNumber) return;
        if (driver.isPitOut || driver.onTrackClass === 'to') {
          if (!next.has(driver.kartNumber)) {
            const now = new Date();
            next.set(driver.kartNumber, {
              enteredAtDisplay: formatPitEntryTime(now),
              enteredAtMs: now.getTime()
            });
            savePitEntryToServer(driver.kartNumber, now.toISOString());
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [drivers, selectedTrack, formatPitEntryTime, savePitEntryToServer]);

  const handleTrackSelect = (trackId: TrackId) => {
    setSelectedTrack(trackId);
    localStorage.setItem('selectedTrack', trackId);
    setShowTrackPicker(false);
  };

  return (
    <div className="app">
      <div className="app__container">
        {showTrackPicker && (
          <Modal
            isOpen={showTrackPicker}
            onClose={() => setShowTrackPicker(false)}
            title="Pálya kiválasztása"
          >
            <div className="app__track-picker">
              <p className="app__track-picker-text">Válaszd ki, melyik pálya adatait szeretnéd látni.</p>
              <div className="app__track-picker-list">
                {Object.values(TRACKS).map(track => (
                  <button
                    key={track.id}
                    type="button"
                    className={`app__track-picker-btn ${selectedTrack === track.id ? 'app__track-picker-btn--active' : ''}`}
                    onClick={() => handleTrackSelect(track.id)}
                  >
                    <span className="app__track-picker-name">{track.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}

        <Header 
          title={raceInfo.title2} 
          track={raceInfo.track}
          connectionStatus={connectionStatus}
          countdown={raceInfo.countdown}
          lightStatus={raceInfo.lightStatus}
          selectedTrack={selectedTrack}
          onTrackChange={setSelectedTrack}
        />

        <MessageBanner message={raceInfo.message} />

        <main className="app__main">
          <DriverTracker
            drivers={drivers}
            kartStyles={kartStyles}
            followedDriver={followedDriver}
            onFollowDriver={setFollowedDriver}
            savedDrivers={savedDrivers}
            trackId={selectedTrack}
          />

          <KartRankings 
            drivers={drivers}
            kartStats={kartStats} 
            kartStyles={kartStyles}
            activeKarts={activeKarts}
            pitHistoryByKart={pitHistoryByKart}
            trackId={selectedTrack}
          />
          
          <Leaderboard 
            drivers={drivers} 
            isConnected={connectionStatus === 'connected'}
            kartStyles={kartStyles}
            followedDriver={followedDriver}
            trackId={selectedTrack}
          />
        </main>

        <Legend kartStyles={kartStyles} />

        <footer className="app__footer">
          <p>GoKart Monitor | {currentTrack.name} | APEX Timing Live Data</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
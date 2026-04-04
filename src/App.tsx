import { useEffect, useMemo, useState } from 'react';
import { Header, MessageBanner, Leaderboard, KartRankings, Legend, DriverTracker, Modal } from './components';
import { TRACKS, useRaceData, type TrackId } from './hooks/useRaceData';
import './styles/global.css';
import './App.css';

const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>(() => {
    const savedTrack = localStorage.getItem('selectedTrack');
    return (Object.values(TRACKS).some(track => track.id === savedTrack) ? savedTrack : 'max60') as TrackId;
  });
  const [showTrackPicker, setShowTrackPicker] = useState(true);
  const { drivers, raceInfo, connectionStatus, kartStyles, kartStats, savedDrivers } = useRaceData(selectedTrack);
  const [followedDriver, setFollowedDriver] = useState<string | null>(null);

  useEffect(() => {
    setShowTrackPicker(true);
  }, []);

  const currentTrack = useMemo(
    () => Object.values(TRACKS).find(track => track.id === selectedTrack) || TRACKS.MAX60,
    [selectedTrack]
  );

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
            activeKarts={new Set(drivers.map(d => d.kartNumber))}
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
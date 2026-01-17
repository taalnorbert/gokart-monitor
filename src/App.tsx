import { useState } from 'react';
import { Header, MessageBanner, DebugPanel, Leaderboard, KartRankings, Legend, DriverTracker } from './components';
import { useRaceData, type TrackId } from './hooks/useRaceData';
import './styles/global.css';
import './App.css';

const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('default');
  const { drivers, raceInfo, connectionStatus, debugLog, kartStyles, kartStats, savedDrivers } = useRaceData(selectedTrack);
  const [followedDriver, setFollowedDriver] = useState<string | null>(null);

  return (
    <div className="app">
      <div className="app__container">
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

        <DebugPanel 
          logs={debugLog} 
          driverCount={drivers.length}
        />

        <main className="app__main">
          <DriverTracker
            drivers={drivers}
            kartStyles={kartStyles}
            followedDriver={followedDriver}
            onFollowDriver={setFollowedDriver}
            savedDrivers={savedDrivers}
          />

          <KartRankings 
            kartStats={kartStats} 
            kartStyles={kartStyles}
            activeKarts={new Set(drivers.map(d => d.kartNumber))}
          />
          
          <Leaderboard 
            drivers={drivers} 
            isConnected={connectionStatus === 'connected'}
            kartStyles={kartStyles}
            followedDriver={followedDriver}
          />
        </main>

        <Legend kartStyles={kartStyles} />

        <footer className="app__footer">
          <p>GoKart Monitor • APEX Timing Live Data</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
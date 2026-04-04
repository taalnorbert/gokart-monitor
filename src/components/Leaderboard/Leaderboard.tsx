import type { Driver, KartStyle } from '../../types';
import { DriverRow } from './DriverRow';
import type { TrackId } from '../../hooks/useRaceData';
import './Leaderboard.css';

interface LeaderboardProps {
  drivers: Driver[];
  isConnected: boolean;
  kartStyles: Map<string, KartStyle>;
  followedDriver?: string | null;
  trackId: TrackId;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ drivers, isConnected, kartStyles, followedDriver, trackId }) => {
  const isClassicGp = trackId === 'classicgp';

  return (
    <div className="leaderboard">
      <div className="leaderboard__container">
        <table className="leaderboard__table">
          <thead className="leaderboard__header">
            <tr>
              <th className="leaderboard__th">Poz</th>
              <th className="leaderboard__th leaderboard__th--status"></th>
              <th className="leaderboard__th">Kart</th>
              <th className="leaderboard__th leaderboard__th--name">{isClassicGp ? 'Versenyző' : 'Pilóta'}</th>
              {isClassicGp ? (
                <>
                  <th className="leaderboard__th">Nemzetiség</th>
                  <th className="leaderboard__th">Legjobb idő</th>
                  <th className="leaderboard__th">Különbség</th>
                  <th className="leaderboard__th">Utolsó kör</th>
                  <th className="leaderboard__th">Körök száma</th>
                </>
              ) : (
                <>
                  <th className="leaderboard__th leaderboard__th--hide-mobile">S1</th>
                  <th className="leaderboard__th leaderboard__th--hide-mobile">S2</th>
                  <th className="leaderboard__th leaderboard__th--hide-mobile">S3</th>
                  <th className="leaderboard__th leaderboard__th--hide-mobile">Körök</th>
                  <th className="leaderboard__th">Utolsó</th>
                  <th className="leaderboard__th">Legjobb</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, index) => (
              <DriverRow 
                key={driver.id} 
                driver={driver} 
                isFirst={index === 0}
                kartStyles={kartStyles}
                isFollowed={followedDriver === driver.name}
                trackId={trackId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {drivers.length === 0 && isConnected && (
        <div className="leaderboard__empty">
          <p className="leaderboard__empty-text">Várakozás a verseny adataira...</p>
          <div className="leaderboard__loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {drivers.length === 0 && !isConnected && (
        <div className="leaderboard__empty leaderboard__empty--offline">
          <p className="leaderboard__empty-text">Nincs kapcsolat a szerverrel</p>
          <p className="leaderboard__empty-subtext">Próbálj újracsatlakozni...</p>
        </div>
      )}
    </div>
  );
};

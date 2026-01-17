import { useState, useEffect } from 'react';
import type { KartStyle } from '../../types';
import './DriverLapHistory.css';

interface LapRecord {
  id: number;
  timeMs: number;
  timeDisplay: string;
  createdAt: string;
  kart: {
    kartNumber: string;
    kartClass: string | null;
  };
}

interface DriverDetails {
  driver: {
    id: number;
    name: string;
    createdAt: string;
    lapTimes: LapRecord[];
  };
  bestLap: LapRecord | null;
  totalLaps: number;
}

interface DriverLapHistoryProps {
  driverName: string;
  kartStyles: Map<string, KartStyle>;
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`;

export const DriverLapHistory: React.FC<DriverLapHistoryProps> = ({ 
  driverName, 
  kartStyles
}) => {
  const [data, setData] = useState<DriverDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/driver/${encodeURIComponent(driverName)}`);
        if (!response.ok) {
          throw new Error('Nem sikerült betölteni az adatokat');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt');
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [driverName]);

  const getKartStyle = (kartClass: string | null) => {
    if (!kartClass) return { backgroundColor: '#333', color: '#FFF' };
    const style = kartStyles.get(kartClass);
    return {
      backgroundColor: style?.borderBottomColor || '#333',
      color: style?.color || '#FFF',
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeltaFromBest = (timeMs: number, bestTimeMs: number) => {
    const delta = timeMs - bestTimeMs;
    if (delta === 0) return null;
    return `+${(delta / 1000).toFixed(3)}`;
  };

  if (loading) {
    return (
      <div className="driver-lap-history">
        <div className="driver-lap-history__loading">
          <div className="driver-lap-history__spinner"></div>
          <span>Adatok betöltése...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="driver-lap-history">
        <div className="driver-lap-history__error">
          <span className="driver-lap-history__error-icon">⚠️</span>
          <span>{error || 'Nincs adat'}</span>
        </div>
      </div>
    );
  }

  const { driver, bestLap, totalLaps } = data;

  return (
    <div className="driver-lap-history">
      <div className="driver-lap-history__summary">
        <div className="driver-lap-history__stat">
          <span className="driver-lap-history__stat-label">Összes kör</span>
          <span className="driver-lap-history__stat-value">{totalLaps}</span>
        </div>
        
        {bestLap && (
          <>
            <div className="driver-lap-history__stat driver-lap-history__stat--best">
              <span className="driver-lap-history__stat-label">Legjobb idő</span>
              <span className="driver-lap-history__stat-value driver-lap-history__stat-value--best">
                {bestLap.timeDisplay}
              </span>
            </div>
            
            <div className="driver-lap-history__stat">
              <span className="driver-lap-history__stat-label">Legjobb kart</span>
              <span 
                className="driver-lap-history__kart-badge"
                style={getKartStyle(bestLap.kart.kartClass)}
              >
                {bestLap.kart.kartNumber}
              </span>
            </div>
          </>
        )}
        
        <div className="driver-lap-history__stat">
          <span className="driver-lap-history__stat-label">Első kör</span>
          <span className="driver-lap-history__stat-value driver-lap-history__stat-value--date">
            {formatDate(driver.createdAt)}
          </span>
        </div>
      </div>

      {driver.lapTimes.length > 0 ? (
        <div className="driver-lap-history__table-container">
          <table className="driver-lap-history__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Időpont</th>
                <th>Kart</th>
                <th>Köridő</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {driver.lapTimes.map((lap, index) => {
                const isBest = bestLap && lap.timeMs === bestLap.timeMs;
                const delta = bestLap ? getDeltaFromBest(lap.timeMs, bestLap.timeMs) : null;
                
                return (
                  <tr 
                    key={lap.id} 
                    className={isBest ? 'driver-lap-history__row--best' : ''}
                  >
                    <td className="driver-lap-history__cell--index">
                      {driver.lapTimes.length - index}
                    </td>
                    <td className="driver-lap-history__cell--date">
                      {formatDate(lap.createdAt)}
                    </td>
                    <td>
                      <span 
                        className="driver-lap-history__kart-badge driver-lap-history__kart-badge--small"
                        style={getKartStyle(lap.kart.kartClass)}
                      >
                        {lap.kart.kartNumber}
                      </span>
                    </td>
                    <td className={`driver-lap-history__cell--time ${isBest ? 'driver-lap-history__cell--time-best' : ''}`}>
                      {lap.timeDisplay}
                      {isBest && <span className="driver-lap-history__best-badge">🏆</span>}
                    </td>
                    <td className="driver-lap-history__cell--delta">
                      {delta && <span className="driver-lap-history__delta">{delta}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="driver-lap-history__empty">
          <span>Nincs rögzített köridő</span>
        </div>
      )}
    </div>
  );
};

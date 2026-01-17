import { useState, useEffect } from 'react';
import type { KartStyle } from '../../types';
import './KartLapHistory.css';

interface LapRecord {
  id: number;
  timeMs: number;
  timeDisplay: string;
  createdAt: string;
  driver: {
    id: number;
    name: string;
  };
}

interface KartDetails {
  kart: {
    id: number;
    kartNumber: string;
    kartClass: string | null;
    lapTimes: LapRecord[];
  };
  bestLap: LapRecord | null;
  kartBestInfo: {
    bestLapTime: number;
    bestLapDisplay: string;
    bestLapDriver: string;
    lapCount: number;
  } | null;
  totalLaps: number;
  uniqueDrivers: string[];
}

interface KartLapHistoryProps {
  kartNumber: string;
  kartClass?: string;
  kartStyles: Map<string, KartStyle>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`;

export const KartLapHistory: React.FC<KartLapHistoryProps> = ({ 
  kartNumber, 
  kartClass,
  kartStyles
}) => {
  const [data, setData] = useState<KartDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKartData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/kart/${encodeURIComponent(kartNumber)}`);
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

    fetchKartData();
  }, [kartNumber]);

  const getKartStyle = () => {
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
      <div className="kart-lap-history">
        <div className="kart-lap-history__loading">
          <div className="kart-lap-history__spinner"></div>
          <span>Adatok betöltése...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="kart-lap-history">
        <div className="kart-lap-history__error">
          <span className="kart-lap-history__error-icon">⚠️</span>
          <span>{error || 'Nincs adat'}</span>
        </div>
      </div>
    );
  }

  const { kart, bestLap, kartBestInfo, totalLaps, uniqueDrivers } = data;

  return (
    <div className="kart-lap-history">
      <div className="kart-lap-history__kart-header">
        <span 
          className="kart-lap-history__kart-badge"
          style={getKartStyle()}
        >
          {kartNumber}
        </span>
        <span className="kart-lap-history__kart-title">Gokart #{kartNumber}</span>
      </div>

      <div className="kart-lap-history__summary">
        <div className="kart-lap-history__stat">
          <span className="kart-lap-history__stat-label">Összes kör</span>
          <span className="kart-lap-history__stat-value">{kartBestInfo?.lapCount || totalLaps}</span>
        </div>
        
        {bestLap && (
          <div className="kart-lap-history__stat kart-lap-history__stat--best">
            <span className="kart-lap-history__stat-label">Legjobb idő</span>
            <span className="kart-lap-history__stat-value kart-lap-history__stat-value--best">
              {kartBestInfo?.bestLapDisplay || bestLap.timeDisplay}
            </span>
          </div>
        )}
        
        {kartBestInfo && (
          <div className="kart-lap-history__stat">
            <span className="kart-lap-history__stat-label">Rekorder</span>
            <span className="kart-lap-history__stat-value kart-lap-history__stat-value--driver">
              {kartBestInfo.bestLapDriver}
            </span>
          </div>
        )}
        
        <div className="kart-lap-history__stat">
          <span className="kart-lap-history__stat-label">Pilóták száma</span>
          <span className="kart-lap-history__stat-value">{uniqueDrivers.length}</span>
        </div>
      </div>

      {uniqueDrivers.length > 0 && (
        <div className="kart-lap-history__drivers">
          <span className="kart-lap-history__drivers-label">Pilóták akik vezették:</span>
          <div className="kart-lap-history__drivers-list">
            {uniqueDrivers.map(name => (
              <span key={name} className="kart-lap-history__driver-tag">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {kart.lapTimes.length > 0 ? (
        <div className="kart-lap-history__table-container">
          <table className="kart-lap-history__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Időpont</th>
                <th>Pilóta</th>
                <th>Köridő</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {kart.lapTimes.map((lap, index) => {
                const isBest = bestLap && lap.timeMs === bestLap.timeMs;
                const delta = bestLap ? getDeltaFromBest(lap.timeMs, bestLap.timeMs) : null;
                
                return (
                  <tr 
                    key={lap.id} 
                    className={isBest ? 'kart-lap-history__row--best' : ''}
                  >
                    <td className="kart-lap-history__cell--index">
                      {kart.lapTimes.length - index}
                    </td>
                    <td className="kart-lap-history__cell--date">
                      {formatDate(lap.createdAt)}
                    </td>
                    <td className="kart-lap-history__cell--driver">
                      {lap.driver.name}
                    </td>
                    <td className={`kart-lap-history__cell--time ${isBest ? 'kart-lap-history__cell--time-best' : ''}`}>
                      {lap.timeDisplay}
                      {isBest && <span className="kart-lap-history__best-badge">🏆</span>}
                    </td>
                    <td className="kart-lap-history__cell--delta">
                      {delta && <span className="kart-lap-history__delta">{delta}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kart-lap-history__empty">
          <span>Nincs rögzített köridő</span>
        </div>
      )}
    </div>
  );
};

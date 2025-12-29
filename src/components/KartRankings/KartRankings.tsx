import { useState } from 'react';
import type { KartStats, KartStyle } from '../../types';
import './KartRankings.css';

interface KartRankingsProps {
  kartStats: KartStats[];
  kartStyles: Map<string, KartStyle>;
  activeKarts?: Set<string>;
}

export const KartRankings: React.FC<KartRankingsProps> = ({ kartStats, kartStyles, activeKarts = new Set() }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedKart, setSelectedKart] = useState<string | null>(null);

  if (kartStats.length === 0) return null;

  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return seconds.toFixed(3);
  };

  const getKartStyle = (kartClass: string) => {
    const style = kartStyles.get(kartClass);
    return {
      backgroundColor: style?.borderBottomColor || '#333',
      color: style?.color || '#FFF',
    };
  };

  const selectedKartData = selectedKart 
    ? kartStats.find(k => k.kartNumber === selectedKart) 
    : null;

  return (
    <div className="kart-rankings">
      <button 
        className="kart-rankings__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="kart-rankings__toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="kart-rankings__toggle-title">🏆 Kart Rangsor</span>
        <span className="kart-rankings__badge">{kartStats.length} kart</span>
      </button>

      {isExpanded && (
        <div className="kart-rankings__content">
          <div className="kart-rankings__list">
            {kartStats.map((kart, index) => {
              const isActive = activeKarts.has(kart.kartNumber);
              return (
              <div 
                key={kart.kartNumber}
                className={`kart-rankings__item ${selectedKart === kart.kartNumber ? 'kart-rankings__item--selected' : ''} ${isActive ? 'kart-rankings__item--active' : ''}`}
                onClick={() => setSelectedKart(selectedKart === kart.kartNumber ? null : kart.kartNumber)}
                title={isActive ? 'Ez a kart jelenleg futamban van' : ''}
              >
                <span className="kart-rankings__rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </span>
                {isActive && <span className="kart-rankings__active-badge">🏁</span>}
                
                <span 
                  className="kart-rankings__kart-badge"
                  style={getKartStyle(kart.kartClass)}
                >
                  {kart.kartNumber}
                </span>
                
                <span className="kart-rankings__time">
                  {kart.bestLapDisplay}
                </span>
                
                <span className="kart-rankings__laps">
                  {kart.lapCount} kör
                </span>
                
                <span className="kart-rankings__driver">
                  {kart.bestLapDriver}
                </span>
              </div>
            );
            })}
          </div>

          {selectedKartData && (
            <div className="kart-rankings__details">
              <h4 className="kart-rankings__details-title">
                <span 
                  className="kart-rankings__kart-badge"
                  style={getKartStyle(selectedKartData.kartClass)}
                >
                  {selectedKartData.kartNumber}
                </span>
                Részletes statisztika
              </h4>
              
              <div className="kart-rankings__stats">
                <div className="kart-rankings__stat">
                  <span className="kart-rankings__stat-label">Legjobb kör</span>
                  <span className="kart-rankings__stat-value kart-rankings__stat-value--best">
                    {selectedKartData.bestLapDisplay}
                  </span>
                </div>
                
                <div className="kart-rankings__stat">
                  <span className="kart-rankings__stat-label">Átlag</span>
                  <span className="kart-rankings__stat-value">
                    {formatTime(selectedKartData.averageLapTime)}
                  </span>
                </div>
                
                <div className="kart-rankings__stat">
                  <span className="kart-rankings__stat-label">Körök</span>
                  <span className="kart-rankings__stat-value">
                    {selectedKartData.lapCount}
                  </span>
                </div>
                
                <div className="kart-rankings__stat">
                  <span className="kart-rankings__stat-label">Utolsó pilóta</span>
                  <span className="kart-rankings__stat-value">
                    {selectedKartData.lastDriver}
                  </span>
                </div>
              </div>

              {selectedKartData.allLapTimes.length > 1 && (
                <div className="kart-rankings__laptimes">
                  <span className="kart-rankings__laptimes-label">Utolsó 5 kör:</span>
                  <div className="kart-rankings__laptimes-list">
                    {selectedKartData.allLapTimes.slice(-5).reverse().map((time, idx) => (
                      <span 
                        key={idx} 
                        className={`kart-rankings__laptime ${time === selectedKartData.bestLapTime ? 'kart-rankings__laptime--best' : ''}`}
                      >
                        {formatTime(time)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

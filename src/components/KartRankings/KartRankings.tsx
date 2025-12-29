import { useState } from 'react';
import type { KartStats, KartStyle } from '../../types';
import { Modal } from '../Modal';
import { KartLapHistory } from '../KartLapHistory';
import './KartRankings.css';

interface KartRankingsProps {
  kartStats: KartStats[];
  kartStyles: Map<string, KartStyle>;
  activeKarts?: Set<string>;
}

export const KartRankings: React.FC<KartRankingsProps> = ({ kartStats, kartStyles, activeKarts = new Set() }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [historyKart, setHistoryKart] = useState<{ kartNumber: string; kartClass: string } | null>(null);

  if (kartStats.length === 0) return null;

  const getKartStyle = (kartClass: string) => {
    const style = kartStyles.get(kartClass);
    return {
      backgroundColor: style?.borderBottomColor || '#333',
      color: style?.color || '#FFF',
    };
  };

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
                className={`kart-rankings__item ${isActive ? 'kart-rankings__item--active' : ''}`}
              >
                <span className="kart-rankings__rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </span>
                
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
                
                <button
                  className="kart-rankings__history-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistoryKart({ kartNumber: kart.kartNumber, kartClass: kart.kartClass });
                  }}
                  title="Köridő előzmények"
                >
                  📊
                </button>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {historyKart && (
        <Modal
          isOpen={!!historyKart}
          onClose={() => setHistoryKart(null)}
          title={`🏎️ Kart #${historyKart.kartNumber} - Köridő Előzmények`}
        >
          <KartLapHistory
            kartNumber={historyKart.kartNumber}
            kartClass={historyKart.kartClass}
            kartStyles={kartStyles}
          />
        </Modal>
      )}
    </div>
  );
};

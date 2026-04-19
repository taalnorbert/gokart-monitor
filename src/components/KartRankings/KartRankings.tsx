import { useState } from 'react';
import type { Driver, KartStats, KartStyle } from '../../types';
import { Modal } from '../Modal';
import { KartLapHistory } from '../KartLapHistory';
import type { TrackId } from '../../hooks/useRaceData';
import './KartRankings.css';

type KartRankingTab = 'race' | 'pit';

interface KartRankingsProps {
  drivers: Driver[];
  kartStats: KartStats[];
  kartStyles: Map<string, KartStyle>;
  activeKarts?: Set<string>;
  pitHistoryByKart?: Map<string, string>;
  trackId: TrackId;
}

export const KartRankings: React.FC<KartRankingsProps> = ({ drivers, kartStats, kartStyles, activeKarts = new Set(), pitHistoryByKart = new Map(), trackId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [historyKart, setHistoryKart] = useState<{ kartNumber: string; kartClass: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<KartRankingTab>('race');

  if (kartStats.length === 0) return null;

  const raceKarts = kartStats.filter(kart => activeKarts.has(kart.kartNumber));
  const pitKarts = kartStats.filter(kart => pitHistoryByKart.has(kart.kartNumber));
  const visibleKarts = selectedTab === 'race' ? raceKarts : pitKarts;
  const rankByKart = new Map(kartStats.map((kart, index) => [kart.kartNumber, index + 1]));
  const currentDriverByKart = new Map(drivers.map(driver => [driver.kartNumber, driver.name]));

  const raceCount = raceKarts.length;
  const pitCount = pitKarts.length;

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
        <span className="kart-rankings__toggle-icon">{isExpanded ? '-' : '+'}</span>
        <span className="kart-rankings__toggle-title">Gokart Rangsor</span>
        <span className="kart-rankings__toggle-subtitle">(itt kell megnézni melyikek a legjobb gokartok)</span>
        <span className="kart-rankings__badge">{kartStats.length} kart</span>
      </button>

      {isExpanded && (
        <div className="kart-rankings__content">
          <div className="kart-rankings__tabs" role="tablist" aria-label="Kart rangsor szűrés">
            <button
              className={`kart-rankings__tab ${selectedTab === 'race' ? 'kart-rankings__tab--active' : ''}`}
              onClick={() => setSelectedTab('race')}
              role="tab"
              aria-selected={selectedTab === 'race'}
              type="button"
            >
              <span>Verseny</span>
              <span className="kart-rankings__tab-count">{raceCount}</span>
            </button>
            <button
              className={`kart-rankings__tab ${selectedTab === 'pit' ? 'kart-rankings__tab--active' : ''}`}
              onClick={() => setSelectedTab('pit')}
              role="tab"
              aria-selected={selectedTab === 'pit'}
              type="button"
            >
              <span>PIT</span>
              <span className="kart-rankings__tab-count">{pitCount}</span>
            </button>
          </div>

          <div className="kart-rankings__summary">
            <span className="kart-rankings__summary-item kart-rankings__summary-item--active">Használatban: {raceCount}</span>
            <span className="kart-rankings__summary-item">Nincs használatban: {pitCount}</span>
          </div>

          <div className="kart-rankings__list">
            {visibleKarts.map((kart, index) => {
              const isActive = activeKarts.has(kart.kartNumber);
              const overallRank = rankByKart.get(kart.kartNumber) ?? index + 1;
              return (
              <div 
                key={kart.kartNumber}
                className={`kart-rankings__item ${isActive ? 'kart-rankings__item--active' : 'kart-rankings__item--pit'}`}
              >
                <span className="kart-rankings__rank">
                  {`${overallRank}.`}
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

                <span className="kart-rankings__driver">
                  <span className="kart-rankings__driver-label">
                    {isActive ? 'Jelenlegi pilóta' : 'Utolsó Pilóta'}
                  </span>
                  <span className="kart-rankings__driver-name">
                        {isActive ? (currentDriverByKart.get(kart.kartNumber) || kart.lastDriver || '-') : (kart.lastDriver || '-')}
                  </span>
                </span>

                {!isActive && pitHistoryByKart.has(kart.kartNumber) && (
                  <span className="kart-rankings__driver">
                    <span className="kart-rankings__driver-label">PIT beállás</span>
                    <span className="kart-rankings__driver-name">{pitHistoryByKart.get(kart.kartNumber)}</span>
                  </span>
                )}
                
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
                  Előzmények
                </button>
              </div>
            );
            })}

            {visibleKarts.length === 0 && (
              <div className="kart-rankings__empty">
                {selectedTab === 'race' ? 'Nincs aktív kart ebben a pályában' : 'Még nem állt be kart PIT-be ebben a sessionben'}
              </div>
            )}
          </div>
        </div>
      )}

      {historyKart && (
        <Modal
          isOpen={!!historyKart}
          onClose={() => setHistoryKart(null)}
          title={`Kart #${historyKart.kartNumber} - Köridő Előzmények`}
        >
          <KartLapHistory
            kartNumber={historyKart.kartNumber}
            kartClass={historyKart.kartClass}
            kartStyles={kartStyles}
            trackId={trackId}
          />
        </Modal>
      )}
    </div>
  );
};

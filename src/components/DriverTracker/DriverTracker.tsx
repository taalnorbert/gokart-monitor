import { useState, useMemo } from 'react';
import type { Driver, KartStyle, SavedDriver } from '../../types';
import { getCellStyle, getStatusStyle } from '../../utils/kartColors';
import './DriverTracker.css';

interface DriverTrackerProps {
  drivers: Driver[];
  kartStyles: Map<string, KartStyle>;
  followedDriver: string | null;
  onFollowDriver: (driverName: string | null) => void;
  savedDrivers?: SavedDriver[];
}

export const DriverTracker: React.FC<DriverTrackerProps> = ({ 
  drivers, 
  kartStyles,
  followedDriver,
  onFollowDriver,
  savedDrivers = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine current race drivers with saved drivers (without duplicates)
  const allDriverOptions = useMemo(() => {
    const currentDriverNames = new Set(drivers.map(d => d.name));
    const options: Array<{ name: string; inRace: boolean; position?: number; kartNumber?: string; bestLapDisplay?: string }> = [];
    
    // Add current race drivers first
    drivers.forEach(driver => {
      options.push({
        name: driver.name,
        inRace: true,
        position: driver.position,
        kartNumber: driver.kartNumber,
      });
    });
    
    // Add saved drivers not in current race
    savedDrivers.forEach(saved => {
      if (!currentDriverNames.has(saved.name)) {
        options.push({
          name: saved.name,
          inRace: false,
          bestLapDisplay: saved.bestLapDisplay ?? undefined,
        });
      }
    });
    
    return options;
  }, [drivers, savedDrivers]);

  const trackedDriver = followedDriver 
    ? drivers.find(d => d.name === followedDriver) 
    : null;

  const getKartStyle = (kartClass: string) => {
    const style = kartStyles.get(kartClass);
    return {
      backgroundColor: style?.borderBottomColor || '#333',
      color: style?.color || '#FFF',
    };
  };

  const statusIndicator = trackedDriver ? getStatusStyle(trackedDriver.statusClass) : null;

  return (
    <div className="driver-tracker">
      <div className="driver-tracker__header">
        <span className="driver-tracker__icon">👤</span>
        <span className="driver-tracker__title">Pilóta Követés</span>
        
        <select 
          className="driver-tracker__select"
          value={followedDriver || ''}
          onChange={(e) => onFollowDriver(e.target.value || null)}
        >
          <option value="">-- Válassz pilótát --</option>
          {allDriverOptions.length > 0 && drivers.length > 0 && (
            <optgroup label="🏁 Aktuális futam">
              {allDriverOptions.filter(d => d.inRace).map(driver => (
                <option key={driver.name} value={driver.name}>
                  #{driver.position} - {driver.name} (Kart {driver.kartNumber})
                </option>
              ))}
            </optgroup>
          )}
          {allDriverOptions.some(d => !d.inRace) && (
            <optgroup label="📊 Korábbi pilóták">
              {allDriverOptions.filter(d => !d.inRace).map(driver => (
                <option key={driver.name} value={driver.name}>
                  {driver.name} {driver.bestLapDisplay ? `(Best: ${driver.bestLapDisplay})` : ''}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {trackedDriver && (
          <button 
            className="driver-tracker__expand"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {trackedDriver && isExpanded && (
        <div className="driver-tracker__content">
          <div className="driver-tracker__info">
            <div className="driver-tracker__main">
              <span 
                className="driver-tracker__kart-badge"
                style={getKartStyle(trackedDriver.kartClass)}
              >
                {trackedDriver.kartNumber}
              </span>
              <span className="driver-tracker__name">{trackedDriver.name}</span>
              <span 
                className="driver-tracker__status"
                style={{ color: statusIndicator?.color }}
              >
                {statusIndicator?.label}
              </span>
            </div>

            <div className="driver-tracker__position">
              <span className="driver-tracker__position-label">Pozíció</span>
              <span className="driver-tracker__position-value">
                {trackedDriver.position}
                <span className="driver-tracker__position-suffix">.</span>
              </span>
            </div>
          </div>

          <div className="driver-tracker__stats">
            <div className="driver-tracker__stat">
              <span className="driver-tracker__stat-label">S1</span>
              <span className="driver-tracker__stat-value" style={getCellStyle(trackedDriver.sector1Class)}>
                {trackedDriver.sector1 || '-'}
              </span>
            </div>
            
            <div className="driver-tracker__stat">
              <span className="driver-tracker__stat-label">S2</span>
              <span className="driver-tracker__stat-value" style={getCellStyle(trackedDriver.sector2Class)}>
                {trackedDriver.sector2 || '-'}
              </span>
            </div>
            
            <div className="driver-tracker__stat">
              <span className="driver-tracker__stat-label">S3</span>
              <span className="driver-tracker__stat-value" style={getCellStyle(trackedDriver.sector3Class)}>
                {trackedDriver.sector3 || '-'}
              </span>
            </div>
            
            <div className="driver-tracker__stat">
              <span className="driver-tracker__stat-label">Körök</span>
              <span className="driver-tracker__stat-value">
                {trackedDriver.laps || '0'}
              </span>
            </div>
            
            <div className="driver-tracker__stat">
              <span className="driver-tracker__stat-label">Utolsó</span>
              <span className="driver-tracker__stat-value" style={getCellStyle(trackedDriver.lastLapClass)}>
                {trackedDriver.lastLap || '-'}
              </span>
            </div>
            
            <div className="driver-tracker__stat driver-tracker__stat--best">
              <span className="driver-tracker__stat-label">Legjobb</span>
              <span className="driver-tracker__stat-value" style={getCellStyle(trackedDriver.bestLapClass)}>
                {trackedDriver.bestLap || '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {trackedDriver && !isExpanded && (
        <div className="driver-tracker__mini">
          <span 
            className="driver-tracker__kart-badge driver-tracker__kart-badge--small"
            style={getKartStyle(trackedDriver.kartClass)}
          >
            {trackedDriver.kartNumber}
          </span>
          <span className="driver-tracker__mini-pos">P{trackedDriver.position}</span>
          <span className="driver-tracker__mini-name">{trackedDriver.name}</span>
          <span className="driver-tracker__mini-lap" style={getCellStyle(trackedDriver.lastLapClass)}>
            {trackedDriver.lastLap || '-'}
          </span>
        </div>
      )}
    </div>
  );
};

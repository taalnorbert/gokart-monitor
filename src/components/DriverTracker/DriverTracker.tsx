import { useState } from 'react';
import type { Driver, KartStyle } from '../../types';
import { getCellStyle, getStatusStyle } from '../../utils/kartColors';
import './DriverTracker.css';

interface DriverTrackerProps {
  drivers: Driver[];
  kartStyles: Map<string, KartStyle>;
  followedDriver: string | null;
  onFollowDriver: (driverName: string | null) => void;
}

export const DriverTracker: React.FC<DriverTrackerProps> = ({ 
  drivers, 
  kartStyles,
  followedDriver,
  onFollowDriver 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
          {drivers.map(driver => (
            <option key={driver.id} value={driver.name}>
              #{driver.position} - {driver.name} (Kart {driver.kartNumber})
            </option>
          ))}
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

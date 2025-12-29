import type { Driver, KartStyle } from '../../types';
import { KartBadge } from './KartBadge';
import { getCellStyle, getStatusStyle } from '../../utils/kartColors';
import './DriverRow.css';

interface DriverRowProps {
  driver: Driver;
  isFirst?: boolean;
  kartStyles: Map<string, KartStyle>;
  isFollowed?: boolean;
}

export const DriverRow: React.FC<DriverRowProps> = ({ driver, isFirst, kartStyles, isFollowed }) => {
  const statusIndicator = getStatusStyle(driver.statusClass);
  
  return (
    <tr className={`driver-row ${driver.flashEffect ? 'driver-row--flash' : ''} ${isFirst ? 'driver-row--leader' : ''} ${isFollowed ? 'driver-row--followed' : ''}`}>
      <td className="driver-row__cell driver-row__position">
        <span className={`driver-row__position-badge ${isFirst ? 'driver-row__position-badge--first' : ''}`}>
          {driver.position}
        </span>
      </td>
      
      <td className="driver-row__cell driver-row__status">
        <span 
          className="driver-row__status-dot"
          style={{ color: statusIndicator.color }}
          title={driver.statusClass === 'sr' ? 'In Sector' : driver.statusClass === 'in' ? 'On Track' : 'Off Track'}
        >
          {statusIndicator.label}
        </span>
      </td>
      
      <td className="driver-row__cell">
        <KartBadge 
          kartNumber={driver.kartNumber} 
          kartClass={driver.kartClass} 
          kartStyles={kartStyles}
        />
      </td>
      
      <td className="driver-row__cell driver-row__name">
        {driver.name}
      </td>
      
      <td className="driver-row__cell driver-row__sector driver-row__cell--hide-mobile" style={getCellStyle(driver.sector1Class)}>
        {driver.sector1}
      </td>
      
      <td className="driver-row__cell driver-row__sector driver-row__cell--hide-mobile" style={getCellStyle(driver.sector2Class)}>
        {driver.sector2}
      </td>
      
      <td className="driver-row__cell driver-row__sector driver-row__cell--hide-mobile" style={getCellStyle(driver.sector3Class)}>
        {driver.sector3}
      </td>
      
      <td className="driver-row__cell driver-row__cell--hide-mobile">
        {driver.laps}
      </td>
      
      <td className="driver-row__cell" style={getCellStyle(driver.lastLapClass)}>
        {driver.lastLap}
      </td>
      
      <td className="driver-row__cell" style={getCellStyle(driver.bestLapClass)}>
        {driver.bestLap}
      </td>
    </tr>
  );
};

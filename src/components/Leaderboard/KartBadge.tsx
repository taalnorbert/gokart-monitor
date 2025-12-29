import type { KartStyle } from '../../types';
import './KartBadge.css';

interface KartBadgeProps {
  kartNumber: string;
  kartClass: string;
  kartStyles: Map<string, KartStyle>;
}

export const KartBadge: React.FC<KartBadgeProps> = ({ kartNumber, kartClass, kartStyles }) => {
  if (!kartNumber) return null;

  const style = kartStyles.get(kartClass);
  const backgroundColor = style?.borderBottomColor || '#333';
  const textColor = style?.color || '#FFF';

  return (
    <span 
      className="kart-badge"
      style={{
        backgroundColor,
        color: textColor,
        borderBottomColor: backgroundColor,
      }}
    >
      {kartNumber}
    </span>
  );
};

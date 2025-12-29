import './RaceLights.css';

interface RaceLightsProps {
  status: string;
}

export const RaceLights: React.FC<RaceLightsProps> = ({ status }) => {
  if (!status) return null;

  const getColor = () => {
    if (status.includes('lg')) return 'green';
    if (status.includes('lr')) return 'red';
    if (status.includes('ly')) return 'yellow';
    return 'off';
  };

  const color = getColor();

  return (
    <div className={`race-lights race-lights--${color}`}>
      <div className="race-lights__light"></div>
    </div>
  );
};

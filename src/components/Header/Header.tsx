import type { ConnectionStatus } from '../../types';
import { CountdownTimer } from '../CountdownTimer';
import { RaceLights } from '../RaceLights';
import './Header.css';

interface HeaderProps {
  title: string;
  track: string;
  connectionStatus: ConnectionStatus;
  countdown?: number;
  lightStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  track, 
  connectionStatus, 
  countdown = 0,
  lightStatus = ''
}) => {
  const isConnected = connectionStatus === 'connected';

  return (
    <header className="header">
      <div className="header__content">
        <div className="header__info">
          <div className="header__title-row">
            <RaceLights status={lightStatus} />
            <h1 className="header__title">
              {title || 'APEX Timing'}
            </h1>
          </div>
          {track && (
            <p className="header__track">
              📍 {track}
            </p>
          )}
        </div>
        
        <div className="header__right">
          {countdown > 0 && (
            <CountdownTimer initialSeconds={countdown} />
          )}
          
          <div className="header__status">
            <div 
              className={`header__indicator ${isConnected ? 'header__indicator--live' : 'header__indicator--offline'}`}
              aria-hidden="true"
            />
            <span className="header__status-text">
              {isConnected ? 'LIVE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

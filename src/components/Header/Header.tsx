import { useState } from 'react';
import type { ConnectionStatus } from '../../types';
import { CountdownTimer } from '../CountdownTimer';
import { RaceLights } from '../RaceLights';
import { Modal } from '../Modal';
import { TRACKS, type TrackId } from '../../hooks/useRaceData';
import './Header.css';

interface HeaderProps {
  title: string;
  track: string;
  connectionStatus: ConnectionStatus;
  countdown?: number;
  lightStatus?: string;
  selectedTrack: TrackId;
  onTrackChange: (trackId: TrackId) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  track, 
  connectionStatus, 
  countdown = 0,
  lightStatus = '',
  selectedTrack,
  onTrackChange
}) => {
  const isConnected = connectionStatus === 'connected';
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/reset?trackId=${selectedTrack}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const trackName = TRACKS[Object.keys(TRACKS).find(k => TRACKS[k as keyof typeof TRACKS].id === selectedTrack) as keyof typeof TRACKS]?.name || selectedTrack;
        alert(`Minden adat sikeresen törölve (${trackName})!`);
        setShowResetModal(false);
        // Reload oldal hogy frissüljenek az adatok
        window.location.reload();
      } else {
        alert('Hiba történt a törlés során');
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Hiba történt a törlés során');
    } finally {
      setIsResetting(false);
    }
  };

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
          <div className="header__track-row">
            {track && (
              <p className="header__track">
                {track}
              </p>
            )}
            <select 
              className="header__track-selector"
              value={selectedTrack}
              onChange={(e) => onTrackChange(e.target.value as TrackId)}
              title="Pálya választás"
            >
              {Object.values(TRACKS).map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
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
          
          <button
            className="header__reset-btn"
            onClick={() => setShowResetModal(true)}
            title="Minden adat törlése"
          >
            Reset
          </button>
        </div>
      </div>
      
      {showResetModal && (
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Pálya adatainak törlése"
        >
          <div className="header__reset-modal">
            <p className="header__reset-warning">
              Biztos törölni szeretnéd <strong>a(z) {TRACKS[Object.keys(TRACKS).find(k => TRACKS[k as keyof typeof TRACKS].id === selectedTrack) as keyof typeof TRACKS]?.name || selectedTrack} pálya</strong> összes adatát az adatbázisból?
            </p>
            <ul className="header__reset-list">
              <li>Minden köridő törlődik (csak ezen a pályán)</li>
              <li>Minden vezető törlődik (csak ezen a pályán)</li>
              <li>Minden kart statisztika törlődik (csak ezen a pályán)</li>
              <li>Ez a művelet <strong>visszafordíthatatlan</strong>!</li>
            </ul>
            <div className="header__reset-actions">
              <button
                className="header__reset-cancel"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                Mégsem
              </button>
              <button
                className="header__reset-confirm"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? 'Törlés...' : 'Igen, törölj mindent'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};

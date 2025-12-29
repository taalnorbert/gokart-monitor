import { useState } from 'react';
import './DebugPanel.css';

interface DebugPanelProps {
  logs: string[];
  driverCount: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, driverCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="debug-panel">
      <button 
        className="debug-panel__toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="debug-panel__toggle-icon">{isOpen ? '▼' : '▶'}</span>
        <span>Debug Log</span>
        <span className="debug-panel__badge">{driverCount} drivers</span>
      </button>
      
      {isOpen && (
        <div className="debug-panel__content">
          {logs.length === 0 ? (
            <p className="debug-panel__empty">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="debug-panel__log">
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  initialSeconds: number;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds }) => {
  const [seconds, setSeconds] = useState(Math.floor(initialSeconds / 1000));

  useEffect(() => {
    setSeconds(Math.floor(initialSeconds / 1000));
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  if (seconds <= 0) return null;

  const isLow = seconds < 60;

  return (
    <div className={`countdown-timer ${isLow ? 'countdown-timer--low' : ''}`}>
      <span className="countdown-timer__icon">⏱️</span>
      <span className="countdown-timer__time">{formatTime(seconds)}</span>
    </div>
  );
};

export interface Driver {
  id: string;
  position: number;
  group: string;
  groupClass: string;
  status: string;
  statusClass: string;
  rank: string;
  rankClass: string;
  kartNumber: string;
  kartClass: string;
  name: string;
  sector1: string;
  sector1Class: string;
  sector2: string;
  sector2Class: string;
  sector3: string;
  sector3Class: string;
  laps: string;
  lapsClass: string;
  lastLap: string;
  lastLapClass: string;
  bestLap: string;
  bestLapClass: string;
  flashEffect: boolean;
  flashType: string;
}

export interface KartStyle {
  borderBottomColor: string;
  color: string;
}

export interface RaceInfo {
  title1: string;
  title2: string;
  track: string;
  message: string;
  countdown: number;
  lightStatus: string;
  comments: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface KartStats {
  kartNumber: string;
  kartClass: string;
  bestLapTime: number;
  bestLapDisplay: string;
  allLapTimes: number[];
  lapCount: number;
  averageLapTime: number;
  lastDriver: string;
  bestLapDriver: string;
}

export interface SavedDriver {
  name: string;
  totalLaps: number;
  bestLapTime: number | null;
  bestLapDisplay: string | null;
  bestLapKart: string | null;
  createdAt: string;
}


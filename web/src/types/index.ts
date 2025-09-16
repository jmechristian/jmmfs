export interface User {
  _id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  totalPoints: number;
}

export interface Team {
  _id: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
}

export interface Game {
  _id: string;
  week: number;
  season: number;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: string;
  homeSpread: number;
  awaySpread: number;
  publicConsensus: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  isSpreadLocked?: boolean;
}

export interface Pick {
  _id: string;
  gameId: string | { _id: string };
  week: number;
  season: number;
  teamPicked: 'home' | 'away';
  points: number;
  isBestBet: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface WeekSettings {
  _id: string;
  week: number;
  season: number;
  deadline: string;
  isLocked: boolean;
}

export interface LeaderboardEntry {
  user: User;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  bestBetsCorrect: number;
  bestBetsTotal: number;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

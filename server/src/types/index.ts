export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  _id: string;
  apiId: string;
  week: number;
  season: number;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: Date;
  homeSpread: number;
  awaySpread: number;
  publicConsensus: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  _id: string;
  apiId: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
}

export interface Pick {
  _id: string;
  userId: string;
  gameId: string;
  week: number;
  season: number;
  teamPicked: 'home' | 'away';
  points: number; // 1 or 3
  isBestBet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekSettings {
  _id: string;
  week: number;
  season: number;
  deadline: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  user: User;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  bestBetsCorrect: number;
  bestBetsTotal: number;
}

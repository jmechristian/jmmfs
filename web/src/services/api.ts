import axios from 'axios';
import type {
  User,
  Game,
  Pick,
  // WeekSettings,
  LeaderboardEntry,
} from '../types/index.js';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://jmmfs-backend.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username: string, password: string, displayName: string) => {
    const response = await api.post('/auth/register', {
      username,
      password,
      displayName,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },
};

// Games API
export const gamesAPI = {
  getCurrentWeekGames: async (): Promise<Game[]> => {
    const response = await api.get('/games/current');
    return response.data;
  },

  getWeekGames: async (week: number, season?: number): Promise<Game[]> => {
    const response = await api.get(`/games/week/${week}`, {
      params: { season },
    });
    return response.data;
  },

  // Admin spread management
  updateSpread: async (
    gameId: string,
    homeSpread: number,
    awaySpread: number
  ) => {
    const response = await api.put('/games/admin/update-spread', {
      gameId,
      homeSpread,
      awaySpread,
    });
    return response.data;
  },

  lockSpreads: async (week: number, season: number, isLocked: boolean) => {
    const response = await api.put('/games/admin/lock-spreads', {
      week,
      season,
      isLocked,
    });
    return response.data;
  },
};

// Picks API
export const picksAPI = {
  getWeekPicks: async (week: number, season?: number): Promise<Pick[]> => {
    const response = await api.get(`/picks/week/${week}`, {
      params: { season },
    });
    return response.data;
  },

  submitPicks: async (week: number, season: number, picks: any[]) => {
    const response = await api.post('/picks/submit', {
      week,
      season,
      picks,
    });
    return response.data;
  },

  getLeaderboard: async (season?: number): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/picks/leaderboard', {
      params: { season },
    });
    return response.data;
  },

  // Admin functions
  lockWeek: async (week: number, season: number, isLocked: boolean) => {
    const response = await api.post('/picks/admin/lock-week', {
      week,
      season,
      isLocked,
    });
    return response.data;
  },

  setDeadline: async (week: number, season: number, deadline: string) => {
    const response = await api.post('/picks/admin/deadline', {
      week,
      season,
      deadline,
    });
    return response.data;
  },

  submitPicksForUser: async (
    userId: string,
    week: number,
    season: number,
    picks: any[]
  ) => {
    const response = await api.post('/picks/admin/submit-for-user', {
      userId,
      week,
      season,
      picks,
    });
    return response.data;
  },
};

export default api;

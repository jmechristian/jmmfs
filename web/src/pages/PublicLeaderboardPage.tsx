import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types/index.js';
import { picksAPI } from '../services/api';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  BarChart3,
  Target,
} from 'lucide-react';

const PublicLeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await picksAPI.getPublicLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className='h-6 w-6 text-yellow-500' />;
      case 1:
        return <Medal className='h-6 w-6 text-gray-400' />;
      case 2:
        return <Award className='h-6 w-6 text-amber-600' />;
      default:
        return (
          <span className='text-lg font-bold text-gray-600'>#{index + 1}</span>
        );
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStats = () => {
    if (leaderboard.length === 0) return null;

    const totalPicks = leaderboard.reduce(
      (sum, entry) => sum + entry.totalPicks,
      0
    );
    const totalCorrect = leaderboard.reduce(
      (sum, entry) => sum + entry.correctPicks,
      0
    );
    const totalBestBets = leaderboard.reduce(
      (sum, entry) => sum + entry.bestBetsTotal,
      0
    );
    const totalBestBetsCorrect = leaderboard.reduce(
      (sum, entry) => sum + entry.bestBetsCorrect,
      0
    );

    return {
      totalPicks,
      totalCorrect,
      totalBestBets,
      totalBestBetsCorrect,
      overallAccuracy: totalPicks > 0 ? (totalCorrect / totalPicks) * 100 : 0,
      bestBetAccuracy:
        totalBestBets > 0 ? (totalBestBetsCorrect / totalBestBets) * 100 : 0,
    };
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-nfl-primary'></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-nfl-primary text-white py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold mb-2'>
              The James Murray Memorial Football Showdown 2025
            </h1>
            <p className='text-xl text-nfl-gold'>Season Leaderboard</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          {/* Overall Stats */}
          {stats && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <Users className='h-8 w-8 text-nfl-primary' />
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Total Players
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {leaderboard.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <BarChart3 className='h-8 w-8 text-nfl-primary' />
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Total Picks
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {stats.totalPicks}
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <Target className='h-8 w-8 text-nfl-primary' />
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Overall Accuracy
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {stats.overallAccuracy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <Award className='h-8 w-8 text-nfl-primary' />
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Best Bet Accuracy
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {stats.bestBetAccuracy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>
                Season Leaderboard
              </h2>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <TrendingUp className='h-4 w-4' />
                <span>2025 Season</span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className='text-center py-12'>
                <Trophy className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600'>
                  No picks submitted yet. Be the first to make your picks!
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user._id}
                    className={`border rounded-lg p-4 ${getRankColor(index)}`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center justify-center w-8'>
                          {getRankIcon(index)}
                        </div>

                        <div>
                          <h3 className='font-semibold text-gray-900'>
                            {entry.user.displayName}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            @{entry.user.username}
                          </p>
                        </div>
                      </div>

                      <div className='text-right'>
                        <div className='text-2xl font-bold text-nfl-primary'>
                          {entry.totalPoints}
                        </div>
                        <div className='text-sm text-gray-600'>points</div>
                      </div>
                    </div>

                    <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                      <div className='text-center'>
                        <div className='font-semibold text-gray-900'>
                          {entry.correctPicks}
                        </div>
                        <div className='text-gray-600'>Correct Picks</div>
                      </div>
                      <div className='text-center'>
                        <div className='font-semibold text-gray-900'>
                          {entry.totalPicks}
                        </div>
                        <div className='text-gray-600'>Total Picks</div>
                      </div>
                      <div className='text-center'>
                        <div className='font-semibold text-gray-900'>
                          {entry.totalPicks > 0
                            ? Math.round(
                                (entry.correctPicks / entry.totalPicks) * 100
                              )
                            : 0}
                          %
                        </div>
                        <div className='text-gray-600'>Accuracy</div>
                      </div>
                      <div className='text-center'>
                        <div className='font-semibold text-gray-900'>
                          {entry.bestBetsCorrect}/{entry.bestBetsTotal}
                        </div>
                        <div className='text-gray-600'>Best Bets</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboardPage;

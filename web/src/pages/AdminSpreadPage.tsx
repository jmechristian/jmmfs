import React, { useState, useEffect } from 'react';
import type { Game } from '../types/index.js';
import { gamesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Lock, Unlock, Save, Edit3 } from 'lucide-react';

const AdminSpreadPage: React.FC = () => {
  const {} = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(3);
  const [loading, setLoading] = useState(true);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [tempSpreads, setTempSpreads] = useState<{
    [gameId: string]: { home: number; away: number };
  }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGames();
  }, [selectedWeek]);

  const loadGames = async () => {
    try {
      const gamesData = await gamesAPI.getWeekGames(selectedWeek);
      setGames(gamesData);

      // Initialize temp spreads with current spreads
      const initialSpreads: {
        [gameId: string]: { home: number; away: number };
      } = {};
      gamesData.forEach((game) => {
        initialSpreads[game._id] = {
          home: game.homeSpread,
          away: game.awaySpread,
        };
      });
      setTempSpreads(initialSpreads);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpreadChange = (
    gameId: string,
    team: 'home' | 'away',
    value: number
  ) => {
    setTempSpreads((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [team]: value,
      },
    }));
  };

  const saveSpread = async (gameId: string) => {
    setSaving(true);
    try {
      const spreads = tempSpreads[gameId];
      await gamesAPI.updateSpread(gameId, spreads.home, spreads.away);

      // Update local state
      setGames((prev) =>
        prev.map((game) =>
          game._id === gameId
            ? { ...game, homeSpread: spreads.home, awaySpread: spreads.away }
            : game
        )
      );

      setEditingGame(null);
    } catch (error) {
      console.error('Error saving spread:', error);
      alert('Failed to save spread. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const lockAllSpreads = async () => {
    setSaving(true);
    try {
      await gamesAPI.lockSpreads(selectedWeek, 2025, true);
      alert('All spreads locked for Week ' + selectedWeek);
      loadGames(); // Reload to show updated lock status
    } catch (error) {
      console.error('Error locking spreads:', error);
      alert('Failed to lock spreads. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const unlockAllSpreads = async () => {
    setSaving(true);
    try {
      await gamesAPI.lockSpreads(selectedWeek, 2025, false);
      alert('All spreads unlocked for Week ' + selectedWeek);
      loadGames(); // Reload to show updated lock status
    } catch (error) {
      console.error('Error unlocking spreads:', error);
      alert('Failed to unlock spreads. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-nfl-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>
            Admin - Spread Management
          </h2>
          <div className='flex items-center space-x-4'>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nfl-primary'
            >
              {Array.from({ length: 16 }, (_, i) => i + 2).map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Week Actions */}
        <div className='flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg'>
          <h3 className='font-medium text-gray-900'>
            Week {selectedWeek} Actions:
          </h3>
          <button
            onClick={lockAllSpreads}
            disabled={saving}
            className='flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50'
          >
            <Lock className='h-4 w-4' />
            <span>Lock All Spreads</span>
          </button>
          <button
            onClick={unlockAllSpreads}
            disabled={saving}
            className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
          >
            <Unlock className='h-4 w-4' />
            <span>Unlock All Spreads</span>
          </button>
        </div>

        {/* Games List */}
        <div className='space-y-4'>
          {games.map((game) => {
            const isEditing = editingGame === game._id;
            const spreads = tempSpreads[game._id] || {
              home: game.homeSpread,
              away: game.awaySpread,
            };
            const isLocked = game.isSpreadLocked;

            return (
              <div
                key={game._id}
                className={`border rounded-lg p-4 ${
                  isLocked ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-4 mb-2'>
                      <h4 className='font-medium text-gray-900'>
                        {game.awayTeam.abbreviation} @{' '}
                        {game.homeTeam.abbreviation}
                      </h4>
                      {isLocked && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                          <Lock className='h-3 w-3 mr-1' />
                          Locked
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-2'>
                          <label className='text-sm text-gray-600'>
                            {game.homeTeam.abbreviation}:
                          </label>
                          <input
                            type='number'
                            step='0.5'
                            value={spreads.home}
                            onChange={(e) =>
                              handleSpreadChange(
                                game._id,
                                'home',
                                parseFloat(e.target.value)
                              )
                            }
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
                          />
                        </div>
                        <div className='flex items-center space-x-2'>
                          <label className='text-sm text-gray-600'>
                            {game.awayTeam.abbreviation}:
                          </label>
                          <input
                            type='number'
                            step='0.5'
                            value={spreads.away}
                            onChange={(e) =>
                              handleSpreadChange(
                                game._id,
                                'away',
                                parseFloat(e.target.value)
                              )
                            }
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm text-gray-600'>
                        Current Spread:{' '}
                        {game.homeSpread < 0
                          ? `${game.homeTeam.abbreviation} ${game.homeSpread}`
                          : `${game.awayTeam.abbreviation} ${game.awaySpread}`}
                      </div>
                    )}
                  </div>

                  <div className='flex space-x-2 ml-4'>
                    {isEditing ? (
                      <button
                        onClick={() => saveSpread(game._id)}
                        disabled={saving}
                        className='flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50'
                      >
                        <Save className='h-4 w-4' />
                        <span>Save</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingGame(game._id)}
                        disabled={isLocked}
                        className='flex items-center space-x-1 px-3 py-1 bg-nfl-primary text-white rounded text-sm hover:bg-nfl-secondary disabled:opacity-50'
                      >
                        <Edit3 className='h-4 w-4' />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminSpreadPage;

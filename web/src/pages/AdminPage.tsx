import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { picksAPI, authAPI, gamesAPI } from '../services/api';
import type { User, Game } from '../types/index.js';
import {
  Settings,
  Lock,
  Unlock,
  Clock,
  Save,
  UserPlus,
  Users,
  Target,
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // User creation state
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // User pick management state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pickWeek, setPickWeek] = useState<number>(2);
  const [weekGames, setWeekGames] = useState<Game[]>([]);
  const [userPicks, setUserPicks] = useState<{
    bestBet: string | null;
    bestBetTeam: 'home' | 'away' | null;
    onePointPicks: string[];
    onePointTeams: ('home' | 'away')[];
  }>({
    bestBet: null,
    bestBetTeam: null,
    onePointPicks: [],
    onePointTeams: [],
  });
  const [submittingPicks, setSubmittingPicks] = useState(false);

  useEffect(() => {
    // Load current week settings
    loadWeekSettings();
    // Load all users
    loadAllUsers();
  }, [currentWeek]);

  useEffect(() => {
    // Load games when pick week changes
    if (pickWeek) {
      loadWeekGames();
    }
  }, [pickWeek]);

  const loadWeekSettings = async () => {
    // This would typically load from an API
    // For now, we'll use default values
    setDeadline('2024-09-15T13:00');
    setIsLocked(false);
  };

  const loadAllUsers = async () => {
    try {
      const users = await authAPI.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadWeekGames = async () => {
    try {
      const games = await gamesAPI.getWeekGames(pickWeek);
      setWeekGames(games);
    } catch (error) {
      console.error('Error loading week games:', error);
    }
  };

  const handleSetDeadline = async () => {
    if (!deadline) {
      setMessage('Please set a deadline');
      return;
    }

    setLoading(true);
    try {
      await picksAPI.setDeadline(currentWeek, 2024, deadline);
      setMessage('Deadline updated successfully');
    } catch (error) {
      setMessage('Failed to update deadline');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      await picksAPI.lockWeek(currentWeek, 2024, !isLocked);
      setIsLocked(!isLocked);
      setMessage(
        `Week ${currentWeek} ${!isLocked ? 'locked' : 'unlocked'} successfully`
      );
    } catch (error) {
      setMessage('Failed to update lock status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.displayName || !newUser.password) {
      setMessage('Please fill in all fields');
      return;
    }

    setCreatingUser(true);
    try {
      await authAPI.register(
        newUser.username,
        newUser.password,
        newUser.displayName
      );
      setMessage(`User ${newUser.displayName} created successfully`);
      setNewUser({ username: '', displayName: '', password: '', role: 'user' });
      loadAllUsers(); // Refresh user list
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUserPickSelection = (
    gameId: string,
    isBestBet: boolean,
    team: 'home' | 'away'
  ) => {
    setUserPicks((prev) => {
      if (isBestBet) {
        return {
          ...prev,
          bestBet: prev.bestBet === gameId ? null : gameId,
          bestBetTeam: prev.bestBet === gameId ? null : team,
          onePointPicks: prev.onePointPicks.filter((id) => id !== gameId),
        };
      } else {
        const isSelected = prev.onePointPicks.includes(gameId);
        return {
          ...prev,
          bestBet: prev.bestBet === gameId ? null : prev.bestBet,
          onePointPicks: isSelected
            ? prev.onePointPicks.filter((id) => id !== gameId)
            : prev.onePointPicks.length < 2
            ? [...prev.onePointPicks, gameId]
            : prev.onePointPicks,
          onePointTeams: isSelected
            ? prev.onePointTeams.filter(
                (_, index) => prev.onePointPicks[index] !== gameId
              )
            : prev.onePointPicks.length < 2
            ? [...prev.onePointTeams, team]
            : prev.onePointTeams,
        };
      }
    });
  };

  const handleSubmitUserPicks = async () => {
    if (
      !selectedUser ||
      !userPicks.bestBet ||
      userPicks.onePointPicks.length !== 2
    ) {
      setMessage(
        'Please select a user and make 3 picks (1 best bet + 2 one-point picks)'
      );
      return;
    }

    setSubmittingPicks(true);
    try {
      const allPicks = [
        {
          gameId: userPicks.bestBet,
          teamPicked: userPicks.bestBetTeam,
          isBestBet: true,
        },
        ...userPicks.onePointPicks.map((gameId, index) => ({
          gameId,
          teamPicked: userPicks.onePointTeams[index],
          isBestBet: false,
        })),
      ];

      await picksAPI.submitPicksForUser(selectedUser, pickWeek, 2025, allPicks);
      setMessage(
        `Picks submitted successfully for ${
          allUsers.find((u) => u._id === selectedUser)?.displayName
        }`
      );
      setUserPicks({ bestBet: null, onePointPicks: [] });
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to submit picks');
    } finally {
      setSubmittingPicks(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className='text-center py-12'>
        <Settings className='h-12 w-12 text-gray-400 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Access Denied
        </h2>
        <p className='text-gray-600'>
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>Admin Controls</h2>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <Settings className='h-4 w-4' />
            <span>Week {currentWeek} Settings</span>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.includes('successfully')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Week Selection */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Week Management
            </h3>

            <div>
              <label
                htmlFor='week'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Current Week
              </label>
              <select
                id='week'
                value={currentWeek}
                onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline Management */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Deadline Management
            </h3>

            <div>
              <label
                htmlFor='deadline'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Pick Deadline
              </label>
              <input
                type='datetime-local'
                id='deadline'
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
              />
            </div>

            <button
              onClick={handleSetDeadline}
              disabled={loading}
              className='w-full flex items-center justify-center space-x-2 bg-nfl-primary text-white px-4 py-2 rounded-md hover:bg-nfl-secondary disabled:opacity-50'
            >
              <Clock className='h-4 w-4' />
              <span>Set Deadline</span>
            </button>
          </div>
        </div>

        {/* Lock Management */}
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Pick Locking
          </h3>

          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
            <div>
              <h4 className='font-medium text-gray-900'>
                Week {currentWeek} Picks
              </h4>
              <p className='text-sm text-gray-600'>
                {isLocked
                  ? 'Picks are currently locked and cannot be modified'
                  : 'Picks are currently unlocked and can be modified'}
              </p>
            </div>

            <button
              onClick={handleToggleLock}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                isLocked
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {isLocked ? (
                <>
                  <Unlock className='h-4 w-4' />
                  <span>Unlock Picks</span>
                </>
              ) : (
                <>
                  <Lock className='h-4 w-4' />
                  <span>Lock Picks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Pick Management */}
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            User Pick Management
          </h3>

          <div className='bg-blue-50 rounded-lg p-6 mb-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <Target className='h-5 w-5 text-blue-600' />
              <h4 className='font-medium text-blue-900'>
                Make Picks for Users
              </h4>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                >
                  <option value=''>Choose a user...</option>
                  {allUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.displayName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Week
                </label>
                <select
                  value={pickWeek}
                  onChange={(e) => setPickWeek(parseInt(e.target.value))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                >
                  {Array.from({ length: 16 }, (_, i) => i + 2).map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-end'>
                <button
                  onClick={handleSubmitUserPicks}
                  disabled={
                    submittingPicks ||
                    !selectedUser ||
                    !userPicks.bestBet ||
                    userPicks.onePointPicks.length !== 2
                  }
                  className='w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  <Target className='h-4 w-4' />
                  <span>
                    {submittingPicks ? 'Submitting...' : 'Submit Picks'}
                  </span>
                </button>
              </div>
            </div>

            {weekGames.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center space-x-4 text-sm'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-nfl-gold rounded'></div>
                    <span>Best Bet (3 points)</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-nfl-primary rounded'></div>
                    <span>One Point Pick</span>
                  </div>
                </div>

                <div className='grid gap-3'>
                  {weekGames.map((game) => {
                    const isBestBet = userPicks.bestBet === game._id;
                    const isBestBetHome =
                      isBestBet && userPicks.bestBetTeam === 'home';
                    const isBestBetAway =
                      isBestBet && userPicks.bestBetTeam === 'away';
                    const isOnePoint = userPicks.onePointPicks.includes(
                      game._id
                    );
                    const onePointIndex = userPicks.onePointPicks.indexOf(
                      game._id
                    );
                    const isOnePointHome =
                      isOnePoint &&
                      userPicks.onePointTeams[onePointIndex] === 'home';
                    const isOnePointAway =
                      isOnePoint &&
                      userPicks.onePointTeams[onePointIndex] === 'away';

                    return (
                      <div
                        key={game._id}
                        className={`border rounded-lg p-3 ${
                          isBestBet
                            ? 'border-nfl-gold bg-yellow-50'
                            : isOnePoint
                            ? 'border-nfl-primary bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='text-sm font-medium text-gray-900'>
                              {game.awayTeam.abbreviation} @{' '}
                              {game.homeTeam.abbreviation}
                            </div>
                            <div className='text-sm text-gray-600'>
                              {game.homeSpread < 0 ? (
                                <span>
                                  <span className='font-semibold text-nfl-primary'>
                                    {game.homeTeam.abbreviation}
                                  </span>{' '}
                                  {game.homeSpread} (Favorite)
                                </span>
                              ) : (
                                <span>
                                  <span className='font-semibold text-nfl-primary'>
                                    {game.awayTeam.abbreviation}
                                  </span>{' '}
                                  {game.awaySpread} (Favorite)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='flex space-x-2 ml-4'>
                            {/* Home Team Pick */}
                            <button
                              onClick={() =>
                                handleUserPickSelection(game._id, true, 'home')
                              }
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                isBestBetHome
                                  ? 'bg-nfl-gold text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {game.homeTeam.abbreviation}{' '}
                              {game.homeSpread < 0
                                ? game.homeSpread
                                : '+' + game.homeSpread}{' '}
                              (3pts)
                            </button>
                            <button
                              onClick={() =>
                                handleUserPickSelection(game._id, false, 'home')
                              }
                              disabled={
                                userPicks.onePointPicks.length >= 2 &&
                                !isOnePoint
                              }
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                isOnePointHome
                                  ? 'bg-nfl-primary text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } disabled:opacity-50`}
                            >
                              {game.homeTeam.abbreviation}{' '}
                              {game.homeSpread < 0
                                ? game.homeSpread
                                : '+' + game.homeSpread}{' '}
                              (1pt)
                            </button>

                            {/* Away Team Pick */}
                            <button
                              onClick={() =>
                                handleUserPickSelection(game._id, true, 'away')
                              }
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                isBestBetAway
                                  ? 'bg-nfl-gold text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {game.awayTeam.abbreviation}{' '}
                              {game.awaySpread < 0
                                ? game.awaySpread
                                : '+' + game.awaySpread}{' '}
                              (3pts)
                            </button>
                            <button
                              onClick={() =>
                                handleUserPickSelection(game._id, false, 'away')
                              }
                              disabled={
                                userPicks.onePointPicks.length >= 2 &&
                                !isOnePoint
                              }
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                isOnePointAway
                                  ? 'bg-nfl-primary text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } disabled:opacity-50`}
                            >
                              {game.awayTeam.abbreviation}{' '}
                              {game.awaySpread < 0
                                ? game.awaySpread
                                : '+' + game.awaySpread}{' '}
                              (1pt)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Management */}
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            User Management
          </h3>

          <div className='bg-gray-50 rounded-lg p-6'>
            <div className='flex items-center space-x-2 mb-4'>
              <UserPlus className='h-5 w-5 text-gray-600' />
              <h4 className='font-medium text-gray-900'>Create New User</h4>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Username
                </label>
                <input
                  type='text'
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                  placeholder='Enter username'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Display Name
                </label>
                <input
                  type='text'
                  value={newUser.displayName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, displayName: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                  placeholder='Enter display name'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Password
                </label>
                <input
                  type='password'
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                  placeholder='Enter password'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as 'user' | 'admin',
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nfl-primary focus:border-nfl-primary'
                >
                  <option value='user'>User</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateUser}
              disabled={creatingUser}
              className='mt-4 flex items-center justify-center space-x-2 bg-nfl-primary text-white px-4 py-2 rounded-md hover:bg-nfl-secondary disabled:opacity-50'
            >
              <UserPlus className='h-4 w-4' />
              <span>{creatingUser ? 'Creating...' : 'Create User'}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Quick Actions
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <button className='flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50'>
              <Save className='h-5 w-5 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                Update Spreads
              </span>
            </button>

            <button className='flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50'>
              <Clock className='h-5 w-5 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                Calculate Scores
              </span>
            </button>

            <button className='flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50'>
              <Settings className='h-5 w-5 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                System Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

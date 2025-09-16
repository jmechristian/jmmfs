import React, { useState, useEffect, useCallback } from 'react';
import type { Game, Pick } from '../types/index.js';
import { gamesAPI, picksAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const HomePage: React.FC = () => {
  useAuth();

  const getGameId = (gameId: string | { _id: string }): string => {
    return typeof gameId === 'string' ? gameId : gameId._id;
  };
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentWeek] = useState(3); // Week 3 is current
  const [selectedWeek, setSelectedWeek] = useState(3); // Start with current week
  const [selectedPicks, setSelectedPicks] = useState<{
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

  const loadData = useCallback(async () => {
    try {
      const [gamesData, picksData] = await Promise.all([
        gamesAPI.getWeekGames(selectedWeek),
        picksAPI.getWeekPicks(selectedWeek),
      ]);

      setGames(gamesData);
      setPicks(picksData);

      // Only initialize selected picks for current week (where picks can be made)
      if (selectedWeek === currentWeek) {
        const bestBet = picksData.find((p) => p.isBestBet);
        const onePointPicks = picksData.filter((p) => !p.isBestBet);

        setSelectedPicks({
          bestBet: bestBet ? getGameId(bestBet.gameId) : null,
          bestBetTeam: bestBet?.teamPicked || null,
          onePointPicks: onePointPicks.map((p) => getGameId(p.gameId)),
          onePointTeams: onePointPicks.map((p) => p.teamPicked),
        });
      } else {
        // Clear picks for past/future weeks
        setSelectedPicks({
          bestBet: null,
          bestBetTeam: null,
          onePointPicks: [],
          onePointTeams: [],
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, currentWeek]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePickSelection = (
    gameId: string,
    isBestBet: boolean,
    team: 'home' | 'away'
  ) => {
    setSelectedPicks((prev) => {
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

  const handleSubmitPicks = async () => {
    if (!selectedPicks.bestBet || selectedPicks.onePointPicks.length !== 2) {
      alert('Please select 1 best bet (3 points) and 2 one-point picks');
      return;
    }

    setSubmitting(true);
    try {
      const allPicks = [
        {
          gameId: selectedPicks.bestBet,
          teamPicked: selectedPicks.bestBetTeam,
          isBestBet: true,
        },
        ...selectedPicks.onePointPicks.map((gameId, index) => ({
          gameId,
          teamPicked: selectedPicks.onePointTeams[index],
          isBestBet: false,
        })),
      ];

      await picksAPI.submitPicks(selectedWeek, 2024, allPicks);
      await loadData(); // Reload to show updated picks
    } catch (error) {
      console.error('Error submitting picks:', error);
      alert('Failed to submit picks. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getGameStatus = (game: Game) => {
    if (game.status === 'final') return 'Final';
    if (game.status === 'live') return 'Live';
    return format(new Date(game.gameTime), 'MMM d, h:mm a');
  };

  const getPickStatus = (gameId: string) => {
    const pick = picks.find((p) => {
      // Handle both string gameId and populated gameId object
      const pGameId = getGameId(p.gameId);
      return pGameId === gameId;
    });
    if (!pick) return null;

    if (pick.isCorrect === true) return 'correct';
    if (pick.isCorrect === false) return 'incorrect';
    return 'pending';
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-nfl-primary'></div>
      </div>
    );
  }

  const canMakePicks = selectedWeek === currentWeek;
  const isPastWeek = selectedWeek < currentWeek;
  const isFutureWeek = selectedWeek > currentWeek;

  return (
    <div className='space-y-6'>
      {/* Week Navigation Tabs */}
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <Clock className='h-4 w-4' />
            <span>Current Week: {currentWeek}</span>
          </div>
        </div>

        {/* Week Tabs */}
        <div className='flex flex-wrap gap-2 mb-6'>
          {Array.from({ length: 16 }, (_, i) => i + 2).map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedWeek === week
                  ? 'bg-nfl-primary text-white'
                  : week === currentWeek
                  ? 'bg-nfl-gold text-white hover:bg-yellow-600'
                  : week < currentWeek
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
              disabled={week > currentWeek}
            >
              Week {week}
              {week === currentWeek && ' (Current)'}
              {week < currentWeek && ' (Past)'}
            </button>
          ))}
        </div>

        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>
            Week {selectedWeek} {isPastWeek && '(Completed)'}{' '}
            {isFutureWeek && '(Future)'}
          </h3>
          {canMakePicks && (
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <Clock className='h-4 w-4' />
              <span>Deadline: Sunday 1:00 PM ET</span>
            </div>
          )}
        </div>

        {/* Show week summary for past weeks */}
        {isPastWeek && picks.length > 0 && (
          <div className='bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 border-2 border-green-200 shadow-lg'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-xl font-bold text-green-800'>
                  🏆 Week {selectedWeek} Results
                </h4>
                <p className='text-sm text-green-700 font-medium'>
                  {picks.filter((p) => p.isCorrect).length} of {picks.length}{' '}
                  picks correct
                </p>
                <div className='text-xs text-green-600 mt-1'>
                  {picks.filter((p) => p.isBestBet).length} best bet,{' '}
                  {picks.filter((p) => !p.isBestBet).length} one-point picks
                </div>
              </div>
              <div className='text-right'>
                <div className='text-4xl font-bold text-green-600'>
                  {picks.reduce(
                    (total, pick) => total + (pick.pointsEarned || 0),
                    0
                  )}{' '}
                  pts
                </div>
                <div className='text-sm text-green-600 font-medium'>
                  earned this week
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='mb-6'>
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
        </div>

        <div className='grid gap-4'>
          {games.map((game) => {
            const pickStatus = getPickStatus(game._id);
            const isBestBet = selectedPicks.bestBet === game._id;
            const isOnePoint = selectedPicks.onePointPicks.includes(game._id);

            return (
              <div
                key={game._id}
                className={`border rounded-lg p-4 ${
                  isPastWeek && pickStatus
                    ? pickStatus === 'correct'
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                    : isBestBet
                    ? 'border-nfl-gold bg-yellow-50'
                    : isOnePoint
                    ? 'border-nfl-primary bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {game.awayTeam.abbreviation} @{' '}
                          {game.homeTeam.abbreviation}
                        </div>
                        <div className='text-sm text-gray-600'>
                          {getGameStatus(game)}
                        </div>
                      </div>

                      {pickStatus && (
                        <div className='flex items-center space-x-1'>
                          {pickStatus === 'correct' && (
                            <CheckCircle className='h-5 w-5 text-green-500' />
                          )}
                          {pickStatus === 'incorrect' && (
                            <XCircle className='h-5 w-5 text-red-500' />
                          )}
                          {pickStatus === 'pending' && (
                            <Clock className='h-5 w-5 text-gray-400' />
                          )}
                        </div>
                      )}
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

                    {game.status === 'final' && (
                      <div className='text-sm font-medium'>
                        Final: {game.awayTeam.abbreviation} {game.awayScore} -{' '}
                        {game.homeTeam.abbreviation} {game.homeScore}
                      </div>
                    )}

                    {/* Show pick details for past weeks */}
                    {isPastWeek && pickStatus && (
                      <div
                        className={`mt-3 p-4 rounded-lg border-2 ${
                          pickStatus === 'correct'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                pickStatus === 'correct'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            >
                              {pickStatus === 'correct' ? '✓' : '✗'}
                            </div>
                            <div>
                              <div className='font-bold text-lg'>
                                {picks.find((p) => {
                                  const pGameId =
                                    typeof p.gameId === 'string'
                                      ? p.gameId
                                      : getGameId(p.gameId);
                                  return pGameId === game._id;
                                })?.teamPicked === 'home'
                                  ? game.homeTeam.abbreviation
                                  : game.awayTeam.abbreviation}
                                <span className='text-sm font-normal text-gray-600 ml-1'>
                                  {picks.find((p) => {
                                    const pGameId =
                                      typeof p.gameId === 'string'
                                        ? p.gameId
                                        : p.gameId._id;
                                    return pGameId === game._id;
                                  })?.teamPicked === 'home'
                                    ? game.homeSpread < 0
                                      ? '(Favorite)'
                                      : '(Underdog)'
                                    : game.awaySpread < 0
                                    ? '(Favorite)'
                                    : '(Underdog)'}
                                </span>
                                {picks.find((p) => {
                                  const pGameId =
                                    typeof p.gameId === 'string'
                                      ? p.gameId
                                      : getGameId(p.gameId);
                                  return pGameId === game._id;
                                })?.isBestBet
                                  ? ' - Best Bet'
                                  : ''}
                              </div>
                              <div className='text-sm text-gray-600'>
                                {picks.find((p) => {
                                  const pGameId =
                                    typeof p.gameId === 'string'
                                      ? p.gameId
                                      : getGameId(p.gameId);
                                  return pGameId === game._id;
                                })?.teamPicked === 'home'
                                  ? `${game.homeTeam.abbreviation} ${
                                      game.homeSpread < 0
                                        ? game.homeSpread
                                        : '+' + game.homeSpread
                                    }`
                                  : `${game.awayTeam.abbreviation} ${
                                      game.awaySpread < 0
                                        ? game.awaySpread
                                        : '+' + game.awaySpread
                                    }`}
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div
                              className={`text-2xl font-bold ${
                                pickStatus === 'correct'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {pickStatus === 'correct' ? '+' : ''}
                              {picks.find((p) => {
                                const pGameId =
                                  typeof p.gameId === 'string'
                                    ? p.gameId
                                    : p.gameId._id;
                                return pGameId === game._id;
                              })?.pointsEarned || 0}
                            </div>
                            <div className='text-xs text-gray-500'>points</div>
                          </div>
                        </div>
                        <div
                          className={`mt-2 text-sm font-medium ${
                            pickStatus === 'correct'
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {pickStatus === 'correct'
                            ? '🎉 Great pick! You covered the spread!'
                            : '😔 Tough break - the spread got you this time'}
                        </div>
                      </div>
                    )}
                  </div>

                  {canMakePicks && (
                    <div className='flex space-x-2 ml-4'>
                      {/* Home Team Picks */}
                      <button
                        onClick={() =>
                          handlePickSelection(game._id, true, 'home')
                        }
                        disabled={submitting}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          isBestBet
                            ? 'bg-nfl-gold text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {game.homeTeam.abbreviation}{' '}
                        {game.homeSpread < 0
                          ? game.homeSpread
                          : '+' + game.homeSpread}{' '}
                        (3pts)
                      </button>
                      <button
                        onClick={() =>
                          handlePickSelection(game._id, false, 'home')
                        }
                        disabled={
                          submitting ||
                          (selectedPicks.onePointPicks.length >= 2 &&
                            !isOnePoint)
                        }
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          isOnePoint
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

                      {/* Away Team Picks */}
                      <button
                        onClick={() =>
                          handlePickSelection(game._id, true, 'away')
                        }
                        disabled={submitting}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          isBestBet
                            ? 'bg-nfl-gold text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {game.awayTeam.abbreviation}{' '}
                        {game.awaySpread < 0
                          ? game.awaySpread
                          : '+' + game.awaySpread}{' '}
                        (3pts)
                      </button>
                      <button
                        onClick={() =>
                          handlePickSelection(game._id, false, 'away')
                        }
                        disabled={
                          submitting ||
                          (selectedPicks.onePointPicks.length >= 2 &&
                            !isOnePoint)
                        }
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          isOnePoint
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canMakePicks && (
          <div className='mt-6 flex justify-end'>
            <button
              onClick={handleSubmitPicks}
              disabled={
                submitting ||
                !selectedPicks.bestBet ||
                selectedPicks.onePointPicks.length !== 2
              }
              className='bg-nfl-primary text-white px-6 py-2 rounded-md font-medium hover:bg-nfl-secondary disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {submitting ? 'Submitting...' : 'Submit Picks'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

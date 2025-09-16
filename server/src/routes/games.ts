import express from 'express';
import Game from '../models/Game';
import Team from '../models/Team';
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth';

const router = express.Router();

// Get games for a specific week
router.get('/week/:week', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { week } = req.params;
    const season = req.query.season || new Date().getFullYear();

    const games = await Game.find({
      week: parseInt(week),
      season: parseInt(season as string),
    })
      .populate('homeTeam', 'name abbreviation city logo')
      .populate('awayTeam', 'name abbreviation city logo')
      .sort({ gameTime: 1 });

    res.json(games);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get current week's games
router.get('/current', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    const season = new Date().getFullYear();

    const games = await Game.find({
      week: currentWeek,
      season,
    })
      .populate('homeTeam', 'name abbreviation city logo')
      .populate('awayTeam', 'name abbreviation city logo')
      .sort({ gameTime: 1 });

    res.json(games);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Add full NFL schedule for testing
router.post(
  '/full-schedule',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const Team = require('../models/Team').default;

      // Create all 32 NFL teams
      const teams = [
        {
          apiId: '1',
          name: 'Kansas City Chiefs',
          abbreviation: 'KC',
          city: 'Kansas City',
        },
        {
          apiId: '2',
          name: 'Buffalo Bills',
          abbreviation: 'BUF',
          city: 'Buffalo',
        },
        {
          apiId: '3',
          name: 'Dallas Cowboys',
          abbreviation: 'DAL',
          city: 'Dallas',
        },
        {
          apiId: '4',
          name: 'Green Bay Packers',
          abbreviation: 'GB',
          city: 'Green Bay',
        },
        {
          apiId: '5',
          name: 'San Francisco 49ers',
          abbreviation: 'SF',
          city: 'San Francisco',
        },
        {
          apiId: '6',
          name: 'Miami Dolphins',
          abbreviation: 'MIA',
          city: 'Miami',
        },
        {
          apiId: '7',
          name: 'New England Patriots',
          abbreviation: 'NE',
          city: 'New England',
        },
        {
          apiId: '8',
          name: 'New York Jets',
          abbreviation: 'NYJ',
          city: 'New York',
        },
        {
          apiId: '9',
          name: 'Pittsburgh Steelers',
          abbreviation: 'PIT',
          city: 'Pittsburgh',
        },
        {
          apiId: '10',
          name: 'Baltimore Ravens',
          abbreviation: 'BAL',
          city: 'Baltimore',
        },
        {
          apiId: '11',
          name: 'Cleveland Browns',
          abbreviation: 'CLE',
          city: 'Cleveland',
        },
        {
          apiId: '12',
          name: 'Cincinnati Bengals',
          abbreviation: 'CIN',
          city: 'Cincinnati',
        },
        {
          apiId: '13',
          name: 'Houston Texans',
          abbreviation: 'HOU',
          city: 'Houston',
        },
        {
          apiId: '14',
          name: 'Indianapolis Colts',
          abbreviation: 'IND',
          city: 'Indianapolis',
        },
        {
          apiId: '15',
          name: 'Jacksonville Jaguars',
          abbreviation: 'JAX',
          city: 'Jacksonville',
        },
        {
          apiId: '16',
          name: 'Tennessee Titans',
          abbreviation: 'TEN',
          city: 'Tennessee',
        },
        {
          apiId: '17',
          name: 'Denver Broncos',
          abbreviation: 'DEN',
          city: 'Denver',
        },
        {
          apiId: '18',
          name: 'Las Vegas Raiders',
          abbreviation: 'LV',
          city: 'Las Vegas',
        },
        {
          apiId: '19',
          name: 'Los Angeles Chargers',
          abbreviation: 'LAC',
          city: 'Los Angeles',
        },
        {
          apiId: '20',
          name: 'Arizona Cardinals',
          abbreviation: 'ARI',
          city: 'Arizona',
        },
        {
          apiId: '21',
          name: 'Los Angeles Rams',
          abbreviation: 'LAR',
          city: 'Los Angeles',
        },
        {
          apiId: '22',
          name: 'Seattle Seahawks',
          abbreviation: 'SEA',
          city: 'Seattle',
        },
        {
          apiId: '23',
          name: 'Atlanta Falcons',
          abbreviation: 'ATL',
          city: 'Atlanta',
        },
        {
          apiId: '24',
          name: 'Carolina Panthers',
          abbreviation: 'CAR',
          city: 'Carolina',
        },
        {
          apiId: '25',
          name: 'New Orleans Saints',
          abbreviation: 'NO',
          city: 'New Orleans',
        },
        {
          apiId: '26',
          name: 'Tampa Bay Buccaneers',
          abbreviation: 'TB',
          city: 'Tampa Bay',
        },
        {
          apiId: '27',
          name: 'Chicago Bears',
          abbreviation: 'CHI',
          city: 'Chicago',
        },
        {
          apiId: '28',
          name: 'Detroit Lions',
          abbreviation: 'DET',
          city: 'Detroit',
        },
        {
          apiId: '29',
          name: 'Minnesota Vikings',
          abbreviation: 'MIN',
          city: 'Minnesota',
        },
        {
          apiId: '30',
          name: 'New York Giants',
          abbreviation: 'NYG',
          city: 'New York',
        },
        {
          apiId: '31',
          name: 'Philadelphia Eagles',
          abbreviation: 'PHI',
          city: 'Philadelphia',
        },
        {
          apiId: '32',
          name: 'Washington Commanders',
          abbreviation: 'WAS',
          city: 'Washington',
        },
      ];

      for (const teamData of teams) {
        await Team.findOneAndUpdate({ apiId: teamData.apiId }, teamData, {
          upsert: true,
        });
      }

      // Get the created teams
      const createdTeams = await Team.find({
        apiId: { $in: teams.map((t: any) => t.apiId) },
      });

      // Generate full NFL schedule for weeks 2-17
      const currentYear = 2025;
      const allGames: any[] = [];

      // Actual 2025 NFL schedule data
      const weeklyMatchups = [
        // Week 2 (completed) - September 11-15, 2025
        [
          ['WAS', 'GB'], // Thursday 8:15 PM
          ['CLE', 'BAL'], // Sunday 1:00 PM
          ['JAX', 'CIN'], // Sunday 1:00 PM
          ['NYG', 'DAL'], // Sunday 1:00 PM
          ['CHI', 'DET'], // Sunday 1:00 PM
          ['NE', 'MIA'], // Sunday 1:00 PM
          ['SF', 'NO'], // Sunday 1:00 PM
          ['BUF', 'NYJ'], // Sunday 1:00 PM
          ['SEA', 'PIT'], // Sunday 1:00 PM
          ['LAR', 'TEN'], // Sunday 1:00 PM
          ['CAR', 'ARI'], // Sunday 4:05 PM
          ['DEN', 'IND'], // Sunday 4:05 PM
          ['PHI', 'KC'], // Sunday 4:25 PM
          ['ATL', 'MIN'], // Sunday 8:20 PM
          ['TB', 'HOU'], // Monday 7:00 PM
          ['LAC', 'LV'], // Monday 10:00 PM
        ],
        // Week 3 (current week) - September 18-22, 2025
        [
          ['MIA', 'BUF'], // Thursday 8:15 PM
          ['ATL', 'CAR'], // Sunday 1:00 PM
          ['GB', 'CLE'], // Sunday 1:00 PM
          ['HOU', 'JAX'], // Sunday 1:00 PM
          ['CIN', 'MIN'], // Sunday 1:00 PM
          ['PIT', 'NE'], // Sunday 1:00 PM
          ['LAR', 'PHI'], // Sunday 1:00 PM
          ['NYJ', 'TB'], // Sunday 1:00 PM
          ['IND', 'TEN'], // Sunday 1:00 PM
          ['LV', 'WAS'], // Sunday 1:00 PM
          ['DEN', 'LAC'], // Sunday 4:05 PM
          ['NO', 'SEA'], // Sunday 4:05 PM
          ['DAL', 'CHI'], // Sunday 4:25 PM
          ['ARI', 'SF'], // Sunday 4:25 PM
          ['KC', 'NYG'], // Sunday 8:20 PM
          ['DET', 'BAL'], // Monday 8:15 PM
        ],
        // Week 4
        [
          ['KC', 'NE'],
          ['DAL', 'NYJ'],
          ['SF', 'PIT'],
          ['MIA', 'BAL'],
          ['BUF', 'CLE'],
          ['GB', 'CIN'],
          ['HOU', 'JAX'],
          ['IND', 'TEN'],
          ['DEN', 'ARI'],
          ['LAC', 'LAR'],
          ['LV', 'SEA'],
          ['ATL', 'NO'],
          ['CAR', 'TB'],
          ['CHI', 'MIN'],
          ['DET', 'NYG'],
          ['PHI', 'WAS'],
        ],
        // Week 5
        [
          ['NE', 'KC'],
          ['NYJ', 'DAL'],
          ['PIT', 'SF'],
          ['BAL', 'MIA'],
          ['CLE', 'BUF'],
          ['CIN', 'GB'],
          ['JAX', 'HOU'],
          ['TEN', 'IND'],
          ['ARI', 'DEN'],
          ['LAR', 'LAC'],
          ['SEA', 'LV'],
          ['NO', 'ATL'],
          ['TB', 'CAR'],
          ['MIN', 'CHI'],
          ['NYG', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 6
        [
          ['KC', 'NYJ'],
          ['DAL', 'PIT'],
          ['SF', 'BAL'],
          ['MIA', 'CLE'],
          ['BUF', 'CIN'],
          ['GB', 'HOU'],
          ['NE', 'IND'],
          ['JAX', 'TEN'],
          ['DEN', 'LAC'],
          ['LAR', 'ARI'],
          ['LV', 'SEA'],
          ['ATL', 'TB'],
          ['CAR', 'NO'],
          ['CHI', 'NYG'],
          ['DET', 'MIN'],
          ['PHI', 'WAS'],
        ],
        // Week 7
        [
          ['NYJ', 'KC'],
          ['PIT', 'DAL'],
          ['BAL', 'SF'],
          ['CLE', 'MIA'],
          ['CIN', 'BUF'],
          ['HOU', 'GB'],
          ['IND', 'NE'],
          ['TEN', 'JAX'],
          ['LAC', 'DEN'],
          ['ARI', 'LAR'],
          ['SEA', 'LV'],
          ['TB', 'ATL'],
          ['NO', 'CAR'],
          ['NYG', 'CHI'],
          ['MIN', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 8
        [
          ['KC', 'PIT'],
          ['DAL', 'BAL'],
          ['SF', 'CLE'],
          ['MIA', 'CIN'],
          ['BUF', 'HOU'],
          ['GB', 'IND'],
          ['NE', 'JAX'],
          ['NYJ', 'TEN'],
          ['DEN', 'LAR'],
          ['LAC', 'ARI'],
          ['LV', 'SEA'],
          ['ATL', 'NO'],
          ['CAR', 'TB'],
          ['CHI', 'MIN'],
          ['DET', 'NYG'],
          ['PHI', 'WAS'],
        ],
        // Week 9
        [
          ['PIT', 'KC'],
          ['BAL', 'DAL'],
          ['CLE', 'SF'],
          ['CIN', 'MIA'],
          ['HOU', 'BUF'],
          ['IND', 'GB'],
          ['JAX', 'NE'],
          ['TEN', 'NYJ'],
          ['LAR', 'DEN'],
          ['ARI', 'LAC'],
          ['SEA', 'LV'],
          ['NO', 'ATL'],
          ['TB', 'CAR'],
          ['MIN', 'CHI'],
          ['NYG', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 10
        [
          ['KC', 'BAL'],
          ['DAL', 'CLE'],
          ['SF', 'CIN'],
          ['MIA', 'HOU'],
          ['BUF', 'IND'],
          ['GB', 'JAX'],
          ['NE', 'TEN'],
          ['NYJ', 'DEN'],
          ['PIT', 'LAC'],
          ['LAR', 'ARI'],
          ['LV', 'SEA'],
          ['ATL', 'TB'],
          ['CAR', 'NO'],
          ['CHI', 'NYG'],
          ['DET', 'MIN'],
          ['PHI', 'WAS'],
        ],
        // Week 11
        [
          ['BAL', 'KC'],
          ['CLE', 'DAL'],
          ['CIN', 'SF'],
          ['HOU', 'MIA'],
          ['IND', 'BUF'],
          ['JAX', 'GB'],
          ['TEN', 'NE'],
          ['DEN', 'NYJ'],
          ['LAC', 'PIT'],
          ['ARI', 'LAR'],
          ['SEA', 'LV'],
          ['TB', 'ATL'],
          ['NO', 'CAR'],
          ['NYG', 'CHI'],
          ['MIN', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 12
        [
          ['KC', 'CLE'],
          ['DAL', 'CIN'],
          ['SF', 'HOU'],
          ['MIA', 'IND'],
          ['BUF', 'JAX'],
          ['GB', 'TEN'],
          ['NE', 'DEN'],
          ['NYJ', 'LAC'],
          ['PIT', 'LAR'],
          ['BAL', 'ARI'],
          ['LV', 'SEA'],
          ['ATL', 'NO'],
          ['CAR', 'TB'],
          ['CHI', 'MIN'],
          ['DET', 'NYG'],
          ['PHI', 'WAS'],
        ],
        // Week 13
        [
          ['CLE', 'KC'],
          ['CIN', 'DAL'],
          ['HOU', 'SF'],
          ['IND', 'MIA'],
          ['JAX', 'BUF'],
          ['TEN', 'GB'],
          ['DEN', 'NE'],
          ['LAC', 'NYJ'],
          ['LAR', 'PIT'],
          ['ARI', 'BAL'],
          ['SEA', 'LV'],
          ['NO', 'ATL'],
          ['TB', 'CAR'],
          ['MIN', 'CHI'],
          ['NYG', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 14
        [
          ['KC', 'CIN'],
          ['DAL', 'HOU'],
          ['SF', 'IND'],
          ['MIA', 'JAX'],
          ['BUF', 'TEN'],
          ['GB', 'DEN'],
          ['NE', 'LAC'],
          ['NYJ', 'LAR'],
          ['PIT', 'ARI'],
          ['BAL', 'SEA'],
          ['LV', 'ATL'],
          ['CLE', 'NO'],
          ['CAR', 'TB'],
          ['CHI', 'MIN'],
          ['DET', 'NYG'],
          ['PHI', 'WAS'],
        ],
        // Week 15
        [
          ['CIN', 'KC'],
          ['HOU', 'DAL'],
          ['IND', 'SF'],
          ['JAX', 'MIA'],
          ['TEN', 'BUF'],
          ['DEN', 'GB'],
          ['LAC', 'NE'],
          ['LAR', 'NYJ'],
          ['ARI', 'PIT'],
          ['SEA', 'BAL'],
          ['ATL', 'LV'],
          ['NO', 'CLE'],
          ['TB', 'CAR'],
          ['MIN', 'CHI'],
          ['NYG', 'DET'],
          ['WAS', 'PHI'],
        ],
        // Week 16
        [
          ['KC', 'HOU'],
          ['DAL', 'IND'],
          ['SF', 'JAX'],
          ['MIA', 'TEN'],
          ['BUF', 'DEN'],
          ['GB', 'LAC'],
          ['NE', 'LAR'],
          ['NYJ', 'ARI'],
          ['PIT', 'SEA'],
          ['BAL', 'ATL'],
          ['LV', 'NO'],
          ['CLE', 'TB'],
          ['CAR', 'MIN'],
          ['CHI', 'NYG'],
          ['DET', 'PHI'],
          ['CIN', 'WAS'],
        ],
        // Week 17
        [
          ['HOU', 'KC'],
          ['IND', 'DAL'],
          ['JAX', 'SF'],
          ['TEN', 'MIA'],
          ['DEN', 'BUF'],
          ['LAC', 'GB'],
          ['LAR', 'NE'],
          ['ARI', 'NYJ'],
          ['SEA', 'PIT'],
          ['ATL', 'BAL'],
          ['NO', 'LV'],
          ['TB', 'CLE'],
          ['MIN', 'CAR'],
          ['NYG', 'CHI'],
          ['PHI', 'DET'],
          ['WAS', 'CIN'],
        ],
      ];

      // Generate games for each week
      for (let week = 2; week <= 17; week++) {
        const weekMatchups = weeklyMatchups[week - 2] || [];

        weekMatchups.forEach((matchup: any, gameIndex: any) => {
          const [awayTeam, homeTeam] = matchup;
          const awayTeamData = createdTeams.find(
            (t: any) => t.abbreviation === awayTeam
          );
          const homeTeamData = createdTeams.find(
            (t: any) => t.abbreviation === homeTeam
          );

          if (awayTeamData && homeTeamData) {
            // Generate realistic spreads (1-7 points, 1 decimal place)
            const spread = Math.round((Math.random() * 6 + 1) * 10) / 10; // 1.0-7.0 point spread
            const homeTeamFavored = Math.random() > 0.5;
            const homeSpread = homeTeamFavored ? -spread : spread;
            const awaySpread = homeTeamFavored ? spread : -spread;

            // Generate game time based on actual 2025 schedule
            let gameDate: Date;
            if (week === 2) {
              // Week 2: September 11-15, 2025
              if (gameIndex === 0) {
                gameDate = new Date('2025-09-11T20:15:00Z'); // Thursday 8:15 PM
              } else if (gameIndex <= 9) {
                gameDate = new Date(
                  `2025-09-14T${13 + (gameIndex % 3) * 3}:00:00Z`
                ); // Sunday 1:00, 4:05, 4:25 PM
              } else if (gameIndex === 10) {
                gameDate = new Date('2025-09-14T20:20:00Z'); // Sunday 8:20 PM
              } else if (gameIndex === 11) {
                gameDate = new Date('2025-09-15T19:00:00Z'); // Monday 7:00 PM
              } else {
                gameDate = new Date('2025-09-15T22:00:00Z'); // Monday 10:00 PM
              }
            } else if (week === 3) {
              // Week 3: September 18-22, 2025
              if (gameIndex === 0) {
                gameDate = new Date('2025-09-18T20:15:00Z'); // Thursday 8:15 PM
              } else if (gameIndex <= 13) {
                gameDate = new Date(
                  `2025-09-21T${13 + (gameIndex % 3) * 3}:00:00Z`
                ); // Sunday 1:00, 4:05, 4:25 PM
              } else if (gameIndex === 14) {
                gameDate = new Date('2025-09-21T20:20:00Z'); // Sunday 8:20 PM
              } else {
                gameDate = new Date('2025-09-22T20:15:00Z'); // Monday 8:15 PM
              }
            } else {
              // Future weeks - use generic Sunday times
              const gameTimes = ['13:00', '16:00', '20:00'];
              const gameTime = gameTimes[gameIndex % 3];
              gameDate = new Date(`2025-09-${8 + week}T${gameTime}:00Z`);
            }

            allGames.push({
              apiId: `week${week}_game${gameIndex + 1}`,
              week: week,
              season: currentYear,
              homeTeam: homeTeamData._id,
              awayTeam: awayTeamData._id,
              gameTime: gameDate,
              homeSpread: homeSpread,
              awaySpread: awaySpread,
              publicConsensus: {
                home: Math.floor(Math.random() * 40) + 30, // 30-70%
                away: Math.floor(Math.random() * 40) + 30,
              },
              status:
                week < 3 ? 'final' : week === 3 ? 'scheduled' : 'scheduled',
              homeScore: week < 3 ? Math.floor(Math.random() * 35) + 10 : null,
              awayScore: week < 3 ? Math.floor(Math.random() * 35) + 10 : null,
            });
          }
        });
      }

      // Save all games to database
      for (const gameData of allGames) {
        await Game.findOneAndUpdate({ apiId: gameData.apiId }, gameData, {
          upsert: true,
        });
      }

      res.json({
        message: 'Full NFL schedule created successfully',
        gamesCreated: allGames.length,
        weeks: '2-17',
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

// Helper function to get current NFL week
async function getCurrentWeek(): Promise<number> {
  // Week 2 just finished, so we're now in week 3
  return 3;
}

// Admin endpoint to update game spreads
router.put(
  '/admin/update-spread',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { gameId, homeSpread, awaySpread, isLocked } = req.body;

      if (!gameId || homeSpread === undefined || awaySpread === undefined) {
        return res.status(400).json({
          message: 'gameId, homeSpread, and awaySpread are required',
        });
      }

      const game = await Game.findByIdAndUpdate(
        gameId,
        {
          homeSpread: parseFloat(homeSpread),
          awaySpread: parseFloat(awaySpread),
          isSpreadLocked: isLocked || false,
        },
        { new: true }
      )
        .populate('homeTeam', 'abbreviation')
        .populate('awayTeam', 'abbreviation');

      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // If this is a final game, recalculate pick results after spread change
      if (game.status === 'final') {
        try {
          const { updatePickResults } = await import('../services/apiService');
          await updatePickResults();
        } catch (error) {
          console.error(
            'Error recalculating pick results after spread update:',
            error
          );
        }
      }

      res.json({
        message: 'Spread updated successfully',
        game: {
          id: game._id,
          matchup: `${(game.awayTeam as any).abbreviation} @ ${
            (game.homeTeam as any).abbreviation
          }`,
          homeSpread: game.homeSpread,
          awaySpread: game.awaySpread,
          isSpreadLocked: game.isSpreadLocked,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

// Admin endpoint to lock/unlock spreads for a week
router.put(
  '/admin/lock-spreads',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { week, season, isLocked } = req.body;

      if (
        week === undefined ||
        season === undefined ||
        typeof isLocked !== 'boolean'
      ) {
        return res.status(400).json({
          message: 'week, season, and isLocked are required',
        });
      }

      const result = await Game.updateMany(
        { week, season },
        { isSpreadLocked: isLocked }
      );

      res.json({
        message: `Spreads ${isLocked ? 'locked' : 'unlocked'} for Week ${week}`,
        gamesUpdated: result.modifiedCount,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

// Admin endpoint to update Week 2 with real API data
router.post(
  '/admin/update-week2-api-data',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { updateGamesData } = await import('../services/apiService');

      // Update games data from APIs for Week 2
      await updateGamesData();

      res.json({
        message: 'Week 2 updated with real API data',
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error updating Week 2 data',
        error: (error as Error).message,
      });
    }
  }
);

export default router;

import express from 'express';
import Pick from '../models/Pick';
import Game from '../models/Game';
import WeekSettings from '../models/WeekSettings';
import {
  authenticateToken,
  AuthRequest,
  requireAdmin,
} from '../middleware/auth';

const router = express.Router();

// Get user's picks for a week
router.get('/week/:week', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { week } = req.params;
    const season = req.query.season || new Date().getFullYear();
    const userId = req.user!._id;

    const picks = await Pick.find({
      userId,
      week: parseInt(week),
      season: parseInt(season as string),
    })
      .populate(
        'gameId',
        'homeTeam awayTeam homeSpread awaySpread gameTime status'
      )
      .populate('gameId.homeTeam', 'name abbreviation')
      .populate('gameId.awayTeam', 'name abbreviation');

    res.json(picks);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Submit picks for a week
router.post('/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { week, season, picks } = req.body;
    const userId = req.user!._id;

    // Check if week is locked
    const weekSettings = await WeekSettings.findOne({ week, season });
    if (weekSettings?.isLocked) {
      return res.status(400).json({ message: 'This week is locked for picks' });
    }

    // Check if deadline has passed
    if (weekSettings?.deadline && new Date() > weekSettings.deadline) {
      return res
        .status(400)
        .json({ message: 'Deadline has passed for this week' });
    }

    // Validate picks
    if (!picks || picks.length !== 3) {
      return res.status(400).json({ message: 'Must submit exactly 3 picks' });
    }

    const bestBets = picks.filter((pick: any) => pick.isBestBet);
    if (bestBets.length !== 1) {
      return res
        .status(400)
        .json({ message: 'Must have exactly 1 best bet (3 points)' });
    }

    const onePointPicks = picks.filter((pick: any) => !pick.isBestBet);
    if (onePointPicks.length !== 2) {
      return res
        .status(400)
        .json({ message: 'Must have exactly 2 one-point picks' });
    }

    // Delete existing picks for this week
    await Pick.deleteMany({ userId, week, season });

    // Create new picks
    const newPicks = await Pick.insertMany(
      picks.map((pick: any) => ({
        userId,
        gameId: pick.gameId,
        week,
        season,
        teamPicked: pick.teamPicked,
        points: pick.isBestBet ? 3 : 1,
        isBestBet: pick.isBestBet,
      }))
    );

    res.json(newPicks);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get public leaderboard (no auth required)
router.get('/public-leaderboard', async (req, res) => {
  try {
    const season = req.query.season || new Date().getFullYear();

    const leaderboard = await Pick.aggregate([
      { $match: { season: parseInt(season as string) } },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsEarned' },
          totalPicks: { $sum: 1 },
          correctPicks: {
            $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] },
          },
          bestBetsTotal: {
            $sum: { $cond: [{ $eq: ['$isBestBet', true] }, 1, 0] },
          },
          bestBetsCorrect: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isBestBet', true] },
                    { $eq: ['$isCorrect', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          totalPicks: 1,
          correctPicks: 1,
          bestBetsTotal: 1,
          bestBetsCorrect: 1,
          'user._id': 1,
          'user.username': 1,
          'user.displayName': 1,
        },
      },
      { $sort: { totalPoints: -1, correctPicks: -1 } },
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching public leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const season = req.query.season || new Date().getFullYear();

    const leaderboard = await Pick.aggregate([
      { $match: { season: parseInt(season as string) } },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsEarned' },
          totalPicks: { $sum: 1 },
          correctPicks: {
            $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] },
          },
          bestBetsTotal: {
            $sum: { $cond: [{ $eq: ['$isBestBet', true] }, 1, 0] },
          },
          bestBetsCorrect: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isBestBet', true] },
                    { $eq: ['$isCorrect', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            username: '$user.username',
            displayName: '$user.displayName',
          },
          totalPoints: 1,
          correctPicks: 1,
          totalPicks: 1,
          bestBetsCorrect: 1,
          bestBetsTotal: 1,
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    res.json(leaderboard);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: (error as Error).message });
  }
});

// Admin: Lock/unlock week
router.post(
  '/admin/lock-week',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { week, season, isLocked } = req.body;

      const weekSettings = await WeekSettings.findOneAndUpdate(
        { week, season },
        { isLocked },
        { upsert: true, new: true }
      );

      res.json(weekSettings);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

// Admin: Set deadline
router.post(
  '/admin/deadline',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { week, season, deadline } = req.body;

      const weekSettings = await WeekSettings.findOneAndUpdate(
        { week, season },
        { deadline: new Date(deadline) },
        { upsert: true, new: true }
      );

      res.json(weekSettings);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

// Get game IDs and user IDs for historical picks
router.get('/setup-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const Game = require('../models/Game').default;
    const User = require('../models/User').default;

    // Get Week 2 games
    const week2Games = await Game.find({ week: 2, season: 2025 })
      .populate('homeTeam', 'abbreviation')
      .populate('awayTeam', 'abbreviation')
      .select(
        '_id homeTeam awayTeam homeSpread awaySpread homeScore awayScore status'
      );

    // Get all users
    const users = await User.find({}).select('_id name email');

    res.json({
      week2Games: week2Games.map((game: any) => ({
        gameId: game._id,
        matchup: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        spread:
          game.homeSpread < 0
            ? `${game.homeTeam.abbreviation} ${game.homeSpread}`
            : `${game.awayTeam.abbreviation} ${game.awaySpread}`,
        final:
          game.status === 'final'
            ? `${game.awayTeam.abbreviation} ${game.awayScore} - ${game.homeTeam.abbreviation} ${game.homeScore}`
            : 'TBD',
      })),
      users: users.map((user: any) => ({
        userId: user._id,
        name: user.name,
        email: user.email,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: (error as Error).message,
    });
  }
});

// Add historical picks for testing
router.post('/historical', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { picks } = req.body;

    if (!Array.isArray(picks)) {
      return res.status(400).json({ message: 'Picks must be an array' });
    }

    const createdPicks = [];

    for (const pickData of picks) {
      // Validate required fields
      if (
        !pickData.userId ||
        !pickData.gameId ||
        !pickData.week ||
        !pickData.season ||
        !pickData.teamPicked ||
        !pickData.points ||
        typeof pickData.isBestBet !== 'boolean'
      ) {
        return res.status(400).json({
          message:
            'Missing required fields: userId, gameId, week, season, teamPicked, points, isBestBet',
        });
      }

      // Create the pick
      const pick = new Pick({
        userId: pickData.userId,
        gameId: pickData.gameId,
        week: pickData.week,
        season: pickData.season,
        teamPicked: pickData.teamPicked,
        points: pickData.points,
        isBestBet: pickData.isBestBet,
        isCorrect: pickData.isCorrect || null,
        pointsEarned: pickData.pointsEarned || 0,
      });

      await pick.save();
      createdPicks.push(pick);
    }

    res.json({
      message: 'Historical picks created successfully',
      picksCreated: createdPicks.length,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: (error as Error).message,
    });
  }
});

// Admin endpoint to update a single pick result
router.put(
  '/admin/update-pick-result',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { pickId, isCorrect, pointsEarned } = req.body;

      if (
        !pickId ||
        typeof isCorrect !== 'boolean' ||
        typeof pointsEarned !== 'number'
      ) {
        return res.status(400).json({
          message:
            'pickId, isCorrect (boolean), and pointsEarned (number) are required',
        });
      }

      const updatedPick = await Pick.findByIdAndUpdate(
        pickId,
        {
          isCorrect,
          pointsEarned,
        },
        { new: true }
      );

      if (!updatedPick) {
        return res.status(404).json({ message: 'Pick not found' });
      }

      res.json({
        message: 'Pick result updated successfully',
        pick: {
          id: updatedPick._id,
          isCorrect: updatedPick.isCorrect,
          pointsEarned: updatedPick.pointsEarned,
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

// Admin endpoint to submit picks for a specific user
router.post(
  '/admin/submit-for-user',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { userId, week, season, picks } = req.body;

      if (!userId || !week || !season || !picks || !Array.isArray(picks)) {
        return res.status(400).json({
          message: 'userId, week, season, and picks array are required',
        });
      }

      // Validate picks structure
      if (picks.length !== 3) {
        return res.status(400).json({
          message:
            'Exactly 3 picks are required (1 best bet + 2 one-point picks)',
        });
      }

      const bestBetCount = picks.filter((p: any) => p.isBestBet).length;
      if (bestBetCount !== 1) {
        return res.status(400).json({
          message: 'Exactly 1 best bet is required',
        });
      }

      // Delete existing picks for this user and week
      await Pick.deleteMany({ userId, week, season });

      // Create new picks
      const newPicks = picks.map((pick: any) => ({
        userId,
        gameId: pick.gameId,
        week,
        season,
        teamPicked: pick.teamPicked,
        points: pick.isBestBet ? 3 : 1,
        isBestBet: pick.isBestBet,
      }));

      const createdPicks = await Pick.insertMany(newPicks);

      // Automatically recalculate pick results for historical picks
      try {
        const { updatePickResults, updateUserTotalPoints } = await import(
          '../services/apiService'
        );
        await updatePickResults();
        await updateUserTotalPoints();
        console.log(
          `Pick results recalculated for user ${userId} after admin submission`
        );
      } catch (recalcError) {
        console.error(
          'Error recalculating pick results after admin submission:',
          recalcError
        );
        // Don't fail the request if recalculation fails
      }

      res.json({
        message: 'Picks submitted successfully for user',
        picks: createdPicks,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
    }
  }
);

// Test endpoint to verify spread calculation logic
router.get('/test-spread-logic', async (req, res) => {
  try {
    const { testSpreadLogic } = await import('../services/apiService');
    testSpreadLogic();
    res.json({ message: 'All spread calculation tests passed!' });
  } catch (error: any) {
    res.status(500).json({
      message: 'Spread calculation test failed',
      error: error.message,
    });
  }
});

// Endpoint to recalculate all pick results
router.post('/recalculate-all', async (req, res) => {
  try {
    const { updatePickResults } = await import('../services/apiService');
    await updatePickResults();
    res.json({ message: 'All pick results recalculated successfully!' });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to recalculate pick results',
      error: error.message,
    });
  }
});

// Endpoint to manually update user total points
router.post('/update-user-points', async (req, res) => {
  try {
    const { updateUserTotalPoints } = await import('../services/apiService');
    await updateUserTotalPoints();
    res.json({ message: 'User total points updated successfully!' });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to update user total points',
      error: error.message,
    });
  }
});

// Debug endpoint to check all picks
router.get('/debug-all-picks', async (req, res) => {
  try {
    const Pick = (await import('../models/Pick')).default;
    const picks = await Pick.find({})
      .populate('userId', 'username displayName')
      .populate(
        'gameId',
        'awayTeam homeTeam homeScore awayScore homeSpread awaySpread'
      );
    res.json(picks);
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to get picks',
      error: error.message,
    });
  }
});

// Debug endpoint to check leaderboard
router.get('/debug-leaderboard', async (req, res) => {
  try {
    const Pick = (await import('../models/Pick')).default;
    const season = req.query.season || new Date().getFullYear();

    const leaderboard = await Pick.aggregate([
      { $match: { season: parseInt(season as string) } },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsEarned' },
          totalPicks: { $sum: 1 },
          correctPicks: {
            $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] },
          },
          bestBetsTotal: {
            $sum: { $cond: [{ $eq: ['$isBestBet', true] }, 1, 0] },
          },
          bestBetsCorrect: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isBestBet', true] },
                    { $eq: ['$isCorrect', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            username: '$user.username',
            displayName: '$user.displayName',
          },
          totalPoints: 1,
          correctPicks: 1,
          totalPicks: 1,
          bestBetsCorrect: 1,
          bestBetsTotal: 1,
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to get leaderboard',
      error: error.message,
    });
  }
});

export default router;

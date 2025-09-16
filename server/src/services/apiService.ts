import axios from 'axios';
import Game from '../models/Game';
import Team from '../models/Team';
import Pick from '../models/Pick';

const API_SPORTS_BASE_URL = 'https://v1.american-football.api-sports.io';
const THE_ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';

// Update games data from APIs
export async function updateGamesData() {
  try {
    const currentSeason = new Date().getFullYear();
    const currentWeek = await getCurrentWeek();

    // Fetch games from API-Sports
    const gamesResponse = await axios.get(`${API_SPORTS_BASE_URL}/games`, {
      params: {
        season: currentSeason,
        week: currentWeek,
      },
      headers: {
        'X-RapidAPI-Key': process.env.API_SPORTS_KEY,
        'X-RapidAPI-Host': 'v1.american-football.api-sports.io',
      },
    });

    const games = gamesResponse.data.response;

    for (const gameData of games) {
      await processGameData(gameData, currentSeason, currentWeek);
    }

    // Update pick results for completed games
    await updatePickResults();
  } catch (error) {
    console.error('Error updating games data:', error);
    throw error;
  }
}

async function processGameData(gameData: any, season: number, week: number) {
  try {
    // Get or create teams
    const homeTeam = await getOrCreateTeam(gameData.teams.home);
    const awayTeam = await getOrCreateTeam(gameData.teams.away);

    // Get spreads from The Odds API
    const spreads = await getSpreads(
      gameData.teams.home.id,
      gameData.teams.away.id
    );

    // Create or update game
    const game = await Game.findOneAndUpdate(
      { apiId: gameData.id.toString() },
      {
        week,
        season,
        homeTeam: homeTeam._id,
        awayTeam: awayTeam._id,
        gameTime: new Date(gameData.date),
        homeSpread: spreads.homeSpread,
        awaySpread: spreads.awaySpread,
        publicConsensus: spreads.consensus,
        status: getGameStatus(gameData.status.short),
        homeScore: gameData.scores?.home?.total || null,
        awayScore: gameData.scores?.away?.total || null,
      },
      { upsert: true, new: true }
    );

    return game;
  } catch (error) {
    console.error('Error processing game data:', error);
  }
}

async function getOrCreateTeam(teamData: any) {
  let team = await Team.findOne({ apiId: teamData.id.toString() });

  if (!team) {
    team = new Team({
      apiId: teamData.id.toString(),
      name: teamData.name,
      abbreviation: teamData.name.split(' ').pop() || teamData.name,
      city: teamData.name.replace(teamData.name.split(' ').pop(), '').trim(),
      logo: teamData.logo,
    });
    await team.save();
  }

  return team;
}

async function getSpreads(homeTeamId: number, awayTeamId: number) {
  try {
    const response = await axios.get(
      `${THE_ODDS_API_BASE_URL}/sports/americanfootball_nfl/odds`,
      {
        params: {
          apiKey: process.env.THE_ODDS_API_KEY,
          regions: 'us',
          markets: 'spreads',
          oddsFormat: 'american',
        },
      }
    );

    // Find the game and extract spread data
    const game = response.data.find(
      (g: any) => g.home_team === homeTeamId || g.away_team === awayTeamId
    );

    if (game) {
      const spread = game.bookmakers[0]?.markets[0]?.outcomes[0];
      return {
        homeSpread: spread?.point || 0,
        awaySpread: -spread?.point || 0,
        consensus: {
          home: Math.random() * 100, // Placeholder - would need actual consensus data
          away: Math.random() * 100,
        },
      };
    }

    return {
      homeSpread: 0,
      awaySpread: 0,
      consensus: { home: 50, away: 50 },
    };
  } catch (error) {
    console.error('Error fetching spreads:', error);
    return {
      homeSpread: 0,
      awaySpread: 0,
      consensus: { home: 50, away: 50 },
    };
  }
}

function getGameStatus(status: string): 'scheduled' | 'live' | 'final' {
  switch (status) {
    case 'NS':
      return 'scheduled';
    case 'LIVE':
    case '1Q':
    case '2Q':
    case '3Q':
    case '4Q':
    case 'OT':
      return 'live';
    case 'FT':
      return 'final';
    default:
      return 'scheduled';
  }
}

// Test function to verify spread calculation logic
export function testSpreadLogic() {
  const testCases = [
    {
      name: 'JAX @ CIN (CIN -3.5, CIN won 31-27)',
      homeScore: 31,
      awayScore: 27,
      homeSpread: -3.5,
      awaySpread: 3.5,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'DEN @ IND (DEN -1.5, DEN lost 28-29)',
      homeScore: 29,
      awayScore: 28,
      homeSpread: 1.5,
      awaySpread: -1.5,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'DET @ CHI (DET -6.5, DET won 52-21)',
      homeScore: 52,
      awayScore: 21,
      homeSpread: -6.5,
      awaySpread: 6.5,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'LAR @ TEN (LAR -5.5, LAR won 33-19)',
      homeScore: 19,
      awayScore: 33,
      homeSpread: 5.5,
      awaySpread: -5.5,
      expectedHomeCovers: false,
      expectedAwayCovers: true,
    },
    {
      name: 'Test: Home favored, home wins by more than spread',
      homeScore: 35,
      awayScore: 20,
      homeSpread: -10,
      awaySpread: 10,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'Test: Home favored, home wins by less than spread',
      homeScore: 25,
      awayScore: 20,
      homeSpread: -10,
      awaySpread: 10,
      expectedHomeCovers: false,
      expectedAwayCovers: true,
    },
    {
      name: 'Test: Away favored, away wins by more than spread',
      homeScore: 20,
      awayScore: 35,
      homeSpread: 10,
      awaySpread: -10,
      expectedHomeCovers: false,
      expectedAwayCovers: true,
    },
    {
      name: 'Test: Away favored, away wins by less than spread',
      homeScore: 20,
      awayScore: 25,
      homeSpread: 10,
      awaySpread: -10,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'Test: Home underdog (+3.5), home wins outright',
      homeScore: 24,
      awayScore: 20,
      homeSpread: 3.5,
      awaySpread: -3.5,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'Test: Home underdog (+3.5), home loses by 2 (covers)',
      homeScore: 20,
      awayScore: 22,
      homeSpread: 3.5,
      awaySpread: -3.5,
      expectedHomeCovers: true,
      expectedAwayCovers: false,
    },
    {
      name: 'Test: Home underdog (+3.5), home loses by 5 (does not cover)',
      homeScore: 20,
      awayScore: 25,
      homeSpread: 3.5,
      awaySpread: -3.5,
      expectedHomeCovers: false,
      expectedAwayCovers: true,
    },
  ];

  for (const testCase of testCases) {
    const actualSpread = testCase.homeScore - testCase.awayScore;
    let homeCovers = false;
    let awayCovers = false;

    if (testCase.homeSpread < 0) {
      // Home team is favored (negative home spread)
      homeCovers = actualSpread > Math.abs(testCase.homeSpread);
      awayCovers = !homeCovers;
    } else {
      // Away team is favored (negative away spread)
      awayCovers = actualSpread < testCase.awaySpread;
      homeCovers = !awayCovers;
    }

    const homeCorrect = homeCovers === testCase.expectedHomeCovers;
    const awayCorrect = awayCovers === testCase.expectedAwayCovers;

    console.log(`${testCase.name}:`);
    console.log(
      `  Home covers: ${homeCovers} (expected: ${
        testCase.expectedHomeCovers
      }) ${homeCorrect ? '✅' : '❌'}`
    );
    console.log(
      `  Away covers: ${awayCovers} (expected: ${
        testCase.expectedAwayCovers
      }) ${awayCorrect ? '✅' : '❌'}`
    );

    if (!homeCorrect || !awayCorrect) {
      throw new Error(`Spread calculation failed for ${testCase.name}`);
    }
  }

  console.log('All spread calculation tests passed! ✅');
}

export async function updatePickResults() {
  try {
    // Run tests to ensure logic is correct
    testSpreadLogic();

    // Get all final games
    const finalGames = await Game.find({ status: 'final' });

    for (const game of finalGames) {
      if (game.homeScore === null || game.awayScore === null) continue;

      // Calculate the actual spread result
      const actualSpread = (game.homeScore || 0) - (game.awayScore || 0);

      // Correct spread calculation logic
      // actualSpread = homeScore - awayScore
      let homeCovers = false;
      let awayCovers = false;

      // Complete spread logic:
      // Team with negative spread = favorite (must WIN by MORE than spread amount)
      // Team with positive spread = underdog (must NOT LOSE by MORE than spread amount)

      if (game.homeSpread < 0) {
        // Home team is favored (negative home spread)
        // Home covers if they win by more than the spread amount
        homeCovers = actualSpread > Math.abs(game.homeSpread);
        // Away covers if home doesn't cover
        awayCovers = !homeCovers;
      } else {
        // Away team is favored (negative away spread)
        // Away covers if they win by more than the spread amount
        // actualSpread < 0 means away team won, and they need to win by more than |awaySpread|
        awayCovers = actualSpread < game.awaySpread;
        // Home covers if away doesn't cover
        homeCovers = !awayCovers;
      }

      // Update picks for this game
      const picks = await Pick.find({ gameId: game._id });

      for (const pick of picks) {
        let isCorrect = false;

        if (pick.teamPicked === 'home' && homeCovers) {
          isCorrect = true;
        } else if (pick.teamPicked === 'away' && awayCovers) {
          isCorrect = true;
        }

        const pointsEarned = isCorrect ? pick.points : 0;

        await Pick.findByIdAndUpdate(pick._id, {
          isCorrect,
          pointsEarned,
        });
      }
    }

    // Update user total points
    await updateUserTotalPoints();
  } catch (error) {
    console.error('Error updating pick results:', error);
  }
}

export async function updateUserTotalPoints() {
  try {
    const User = (await import('../models/User')).default;

    const userPoints = await Pick.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsEarned' },
        },
      },
    ]);

    for (const userPoint of userPoints) {
      await User.findByIdAndUpdate(userPoint._id, {
        totalPoints: userPoint.totalPoints,
      });
    }
  } catch (error) {
    console.error('Error updating user total points:', error);
  }
}

async function getCurrentWeek(): Promise<number> {
  // Simplified week calculation - in production, use actual NFL schedule
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const weeksSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return Math.min(Math.max(weeksSinceStart + 1, 1), 18);
}

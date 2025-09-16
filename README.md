# NFL Pick'em Showdown

A season-long NFL spread picking competition for family and friends. Make 3 picks each week - one "best bet" for 3 points and two regular picks for 1 point each. Track scores, compete on the leaderboard, and see who comes out on top at the end of the season!

## Features

- **User Authentication**: Secure login/registration with role-based access
- **Pick Management**: Submit 3 picks per week (1 best bet + 2 regular picks)
- **Real-time Data**: Automatic updates from NFL APIs for games, spreads, and scores
- **Admin Controls**: Set deadlines, lock picks, and manage week settings
- **Leaderboard**: Track standings and statistics throughout the season
- **Responsive Design**: Beautiful, modern UI built with Tailwind CSS

## Tech Stack

### Frontend

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

### Backend

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- Node-cron for scheduled tasks

### APIs

- API-Sports for NFL game data
- The Odds API for spreads and betting data

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- API keys for API-Sports and The Odds API

### Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp env.example .env
   ```

4. Update `.env` with your configuration:

   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/nfl-pickem
   JWT_SECRET=your-super-secret-jwt-key-here
   API_SPORTS_KEY=your-api-sports-key-here
   THE_ODDS_API_KEY=your-the-odds-api-key-here
   NODE_ENV=development
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the web directory:

   ```bash
   cd web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## API Keys Setup

### API-Sports

1. Visit [api-sports.io](https://api-sports.io)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### The Odds API

1. Visit [the-odds-api.com](https://the-odds-api.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

## Usage

### For Regular Users

1. Register for an account
2. Navigate to the current week's games
3. Select your picks:
   - Choose 1 "best bet" (worth 3 points)
   - Choose 2 regular picks (worth 1 point each)
4. Submit your picks before the deadline
5. Track your progress on the leaderboard

### For Admin Users

1. Create an account and manually set role to 'admin' in the database
2. Access the Admin page to:
   - Set pick deadlines for each week
   - Lock/unlock picks
   - Manage week settings
   - Update spreads and scores

## Database Schema

### Users

- Email, password, name
- Role (admin/user)
- Total points accumulated

### Games

- NFL game data from API-Sports
- Home/away teams, spreads, scores
- Public consensus data

### Picks

- User picks for each game
- Point values (1 or 3)
- Correctness tracking

### Week Settings

- Deadlines for each week
- Lock status for picks

## Development

### Building for Production

Backend:

```bash
cd server
npm run build
npm start
```

Frontend:

```bash
cd web
npm run build
```

### Database Management

The application uses MongoDB. Make sure you have MongoDB running locally or have access to a cloud instance.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal/family use. Feel free to adapt it for your own NFL pick'em league!

## Support

For issues or questions, please check the code comments or create an issue in the repository.

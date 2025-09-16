import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';

import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import picksRoutes from './routes/picks';
import { updateGamesData } from './services/apiService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/picks', picksRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfl-pickem')
  .then(() => {
    console.log('Connected to MongoDB');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Schedule data updates every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running scheduled data update...');
  try {
    await updateGamesData();
    console.log('Data update completed');
  } catch (error) {
    console.error('Scheduled update failed:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

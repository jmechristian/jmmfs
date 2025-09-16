import mongoose, { Document, Schema } from 'mongoose';

export interface IPick extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  week: number;
  season: number;
  teamPicked: 'home' | 'away';
  points: number; // 1 or 3
  isBestBet: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
}

const PickSchema = new Schema<IPick>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    teamPicked: {
      type: String,
      enum: ['home', 'away'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      enum: [1, 3],
    },
    isBestBet: {
      type: Boolean,
      default: false,
    },
    isCorrect: {
      type: Boolean,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one pick per user per game
PickSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// Index for efficient queries
PickSchema.index({ userId: 1, week: 1, season: 1 });
PickSchema.index({ week: 1, season: 1 });

export default mongoose.model<IPick>('Pick', PickSchema);

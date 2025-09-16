import mongoose, { Document, Schema } from 'mongoose';

export interface IGame extends Document {
  apiId: string;
  week: number;
  season: number;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  gameTime: Date;
  homeSpread: number;
  awaySpread: number;
  publicConsensus: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  isSpreadLocked?: boolean;
}

const GameSchema = new Schema<IGame>(
  {
    apiId: {
      type: String,
      required: true,
      unique: true,
    },
    week: {
      type: Number,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    homeTeam: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    awayTeam: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    gameTime: {
      type: Date,
      required: true,
    },
    homeSpread: {
      type: Number,
      required: true,
    },
    awaySpread: {
      type: Number,
      required: true,
    },
    publicConsensus: {
      home: {
        type: Number,
        default: 0,
      },
      away: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'final'],
      default: 'scheduled',
    },
    homeScore: {
      type: Number,
    },
    awayScore: {
      type: Number,
    },
    isSpreadLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
GameSchema.index({ week: 1, season: 1 });
GameSchema.index({ gameTime: 1 });

export default mongoose.model<IGame>('Game', GameSchema);

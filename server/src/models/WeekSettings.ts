import mongoose, { Document, Schema } from 'mongoose';

export interface IWeekSettings extends Document {
  week: number;
  season: number;
  deadline: Date;
  isLocked: boolean;
}

const WeekSettingsSchema = new Schema<IWeekSettings>(
  {
    week: {
      type: Number,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one settings per week per season
WeekSettingsSchema.index({ week: 1, season: 1 }, { unique: true });

export default mongoose.model<IWeekSettings>(
  'WeekSettings',
  WeekSettingsSchema
);

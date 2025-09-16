import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  apiId: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
}

const TeamSchema = new Schema<ITeam>(
  {
    apiId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
      uppercase: true,
    },
    city: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITeam>('Team', TeamSchema);

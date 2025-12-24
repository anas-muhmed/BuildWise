// src/lib/backend/models/Project.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: String,
  ownerId: String
}, { timestamps: true });

export const ProjectModel: Model<IProject> = (mongoose.models.Project as Model<IProject>) || mongoose.model<IProject>("Project", ProjectSchema);

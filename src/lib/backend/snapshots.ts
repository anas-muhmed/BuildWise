// src/lib/backend/snapshots.ts
import mongoose from "mongoose";

export interface SnapshotDoc extends mongoose.Document {
  projectId: string;
  version: number;
  nodes: any[];
  edges: any[];
  modules: string[];
  rationale?: string;
  ai_feedback?: any;
  createdAt: Date;
}

const SnapshotSchema = new mongoose.Schema<SnapshotDoc>({
  projectId: { type: String, index: true },
  version: Number,
  nodes: Array,
  edges: Array,
  modules: Array,
  rationale: String,
  ai_feedback: Object,
}, { timestamps: true });

export const Snapshot = mongoose.models.Snapshot || mongoose.model<SnapshotDoc>("Snapshot", SnapshotSchema);

export async function saveSnapshot(projectId: string, snapshot: Partial<SnapshotDoc>) {
  // Remove _id if present (mock snapshots have string _id which causes validation error)
  const cleanSnapshot = { ...snapshot };
  delete (cleanSnapshot as any)._id;
  
  const doc = new Snapshot({ projectId, ...cleanSnapshot });
  await doc.save();
  return doc.toJSON();
}

export async function getLatestSnapshot(projectId: string) {
  return Snapshot.findOne({ projectId }).sort({ createdAt: -1 }).lean().exec();
}
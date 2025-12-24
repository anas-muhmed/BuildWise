// src/lib/backend/models/Snapshot.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { ModuleNode, ModuleEdge } from "./Module";

export interface ISnapshot extends Document {
  projectId: string;
  version: number;
  modules: string[]; // module IDs included in snapshot (approved)
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  createdAt: Date;
  author?: string; // userId or 'system'
  active: boolean; // whether this is canonical snapshot
}

const NodeSchema = new Schema({
  id: String, type: String, label: String, meta: Schema.Types.Mixed
}, { _id: false });

const EdgeSchema = new Schema({
  from: String, to: String, meta: Schema.Types.Mixed
}, { _id: false });

const SnapshotSchema = new Schema<ISnapshot>({
  projectId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  modules: { type: [String], default: [] },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] },
  author: String,
  active: { type: Boolean, default: false }
}, { timestamps: true });

export const SnapshotModel: Model<ISnapshot> = (mongoose.models.Snapshot as Model<ISnapshot>) || mongoose.model<ISnapshot>("Snapshot", SnapshotSchema);

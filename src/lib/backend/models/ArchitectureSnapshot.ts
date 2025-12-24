// lib/backend/models/ArchitectureSnapshot.ts
import mongoose, { Schema, Document } from "mongoose";
import { IModuleNode, IModuleEdge } from "./Module";

// 🎯 PHASE 3: Architecture Snapshot - Versioned Canonical State
// Immutable snapshots created on each module approval
// Enables rollback and audit trail

// ========================================
// INTERFACE
// ========================================

export interface IArchitectureSnapshot extends Document {
  project_id: mongoose.Types.ObjectId;
  modules: mongoose.Types.ObjectId[];  // Array of approved Module IDs
  nodes: IModuleNode[];                // Canonical merged node list
  edges: IModuleEdge[];                // Canonical merged edge list
  version: number;                     // Auto-increments on each approval
  created_by: string;                  // user_id who triggered this snapshot
  created_at: Date;
  published_at?: Date;                 // When published to production
  published_by?: string;               // user_id who published
  target_env?: string;                 // staging | production
  rollback_from?: number;              // If this is a rollback, original version
  merged_by?: string;                  // user_id who merged (for rollback tracking)
}

// ========================================
// SCHEMA
// ========================================

const SnapshotNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String },
  meta: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const SnapshotEdgeSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  meta: {
    protocol: { type: String, enum: ["HTTP", "WebSocket", "gRPC"] },
    secured: { type: Boolean },
    auth: { type: String, enum: ["jwt", "none", "oauth"] }
  }
}, { _id: false });

const ArchitectureSnapshotSchema = new Schema({
  project_id: { type: Schema.Types.ObjectId, required: true, index: true },
  modules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  nodes: { type: [SnapshotNodeSchema], default: [] },
  edges: { type: [SnapshotEdgeSchema], default: [] },
  version: { type: Number, required: true, default: 1 },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  published_at: { type: Date },
  published_by: { type: String },
  target_env: { type: String, enum: ["staging", "production"] },
  rollback_from: { type: Number },
  merged_by: { type: String }
});

// Indexes for efficient queries
ArchitectureSnapshotSchema.index({ project_id: 1, version: -1 }); // Get latest version fast
ArchitectureSnapshotSchema.index({ project_id: 1, created_at: -1 });

// ========================================
// MODEL
// ========================================

export const ArchitectureSnapshot = mongoose.models.ArchitectureSnapshot || 
  mongoose.model<IArchitectureSnapshot>("ArchitectureSnapshot", ArchitectureSnapshotSchema);

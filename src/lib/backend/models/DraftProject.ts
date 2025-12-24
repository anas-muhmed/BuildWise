// lib/backend/models/DraftProject.ts
import mongoose, { Schema, Document } from "mongoose";

// 🎯 MASTER PLAN: Progressive Architecture Builder - Data Models
// This replaces the old "dump a graph on users" approach with conversational, module-by-module construction

// ========================================
// INTERFACES
// ========================================

export interface IRequirements {
  app_type: string;               // e.g., "food delivery", "e-commerce"
  users: string[];                // ["students", "restaurants", "drivers"]
  traffic: "small" | "medium" | "large";
  budget: "low" | "medium" | "high";
  team_size: number;
  must_have_features: string[];   // ["realtime_tracking", "payments", "notifications"]
  priorities: string[];           // ["speed", "cost", "reliability", "realtime"]
}

export interface IStackChoice {
  component: string;              // "frontend", "backend", "database", etc.
  choice: string;                 // "React Native", "Node.js", "PostgreSQL"
  rationale: string;              // Why this choice fits requirements
  confidence: "low" | "medium" | "high";
  alternatives?: string[];        // Other options considered
  learning_resources?: { title: string; url: string }[];
}

export interface IProposal {
  id: string;
  project_id: string;
  components: IStackChoice[];
  created_at: Date;
  ai_generated: boolean;
}

// Phase 3 models moved to separate files:
// - Module: src/lib/backend/models/Module.ts
// - ArchitectureSnapshot: src/lib/backend/models/ArchitectureSnapshot.ts
// - AuditLog: Updated schema below (kept here for backward compatibility)

export interface IDraftProject extends Document {
  owner_id: string;
  title: string;
  starter_prompt: string;         // Original one-liner: "Food delivery app"
  requirements?: IRequirements;   // Captured in Phase 1
  status: "draft" | "in_progress" | "completed" | "submitted" | "approved" | "rejected";
  current_phase: 0 | 1 | 2 | 3 | 4 | 5; // Tracks user's position in flow
  proposal_id?: string;           // Reference to current proposal
  created_at: Date;
  updated_at: Date;
}

// ========================================
// SCHEMAS
// ========================================

const RequirementsSchema = new Schema({
  app_type: { type: String, required: true },
  users: [{ type: String }],
  traffic: { type: String, enum: ["small", "medium", "large"], required: true },
  budget: { type: String, enum: ["low", "medium", "high"], required: true },
  team_size: { type: Number, required: true },
  must_have_features: [{ type: String }],
  priorities: [{ type: String }]
}, { _id: false });

const DraftProjectSchema = new Schema({
  owner_id: { type: String, required: true },
  title: { type: String, required: true },
  starter_prompt: { type: String, required: true },
  requirements: { type: RequirementsSchema },
  status: { 
    type: String, 
    enum: ["draft", "in_progress", "completed", "submitted", "approved", "rejected"],
    default: "draft"
  },
  current_phase: { 
    type: Number, 
    enum: [0, 1, 2, 3, 4, 5],
    default: 0
  },
  proposal_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ========================================
// PROPOSAL SCHEMA
// ========================================

const StackChoiceSchema = new Schema({
  component: { type: String, required: true },
  choice: { type: String, required: true },
  rationale: { type: String, required: true },
  confidence: { 
    type: String, 
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  alternatives: [{ type: String }],
  learning_resources: [{
    title: { type: String },
    url: { type: String }
  }]
}, { _id: false });

const ProposalSchema = new Schema({
  project_id: { type: String, required: true, index: true },
  components: [StackChoiceSchema],
  created_at: { type: Date, default: Date.now },
  ai_generated: { type: Boolean, default: true }
});

// ========================================
// NOTE: Module and ArchitectureSnapshot schemas moved to separate files
// See: src/lib/backend/models/Module.ts
// See: src/lib/backend/models/ArchitectureSnapshot.ts
// ========================================

// ========================================
// AUDIT LOG SCHEMA (Enhanced for Phase 3)
// ========================================

export interface IAuditLog extends Document {
  project_id: mongoose.Types.ObjectId;
  action: string;                 // "created", "module_approved", "proposal_generated", "snapshot_created", "module_rejected"
  by: string;                     // user_id or "AI"
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema({
  project_id: { type: Schema.Types.ObjectId, required: true, index: true },
  action: { type: String, required: true, index: true },
  by: { type: String, required: true },
  reason: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================

DraftProjectSchema.index({ owner_id: 1, created_at: -1 });
ProposalSchema.index({ project_id: 1, created_at: -1 });
AuditLogSchema.index({ project_id: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 }); // For action-based queries

// ========================================
// MODELS
// ========================================

export const DraftProject = 
  mongoose.models.DraftProject || 
  mongoose.model<IDraftProject>("DraftProject", DraftProjectSchema);

export const Proposal = 
  mongoose.models.Proposal || 
  mongoose.model("Proposal", ProposalSchema);

export const AuditLog = 
  mongoose.models.AuditLog || 
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

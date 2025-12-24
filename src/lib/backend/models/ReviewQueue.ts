// lib/backend/models/ReviewQueue.ts
import mongoose, { Schema, Document } from "mongoose";

// 🎯 PHASE 5: Admin Review Queue for Conflicts
// When modules conflict (e.g., two modules want different DB engines),
// or when AI confidence is low, items are flagged for admin review

// ========================================
// INTERFACE
// ========================================

export interface IReviewQueueItem extends Document {
  project_id: mongoose.Types.ObjectId;
  module_id: mongoose.Types.ObjectId;
  conflict_type: "node_disagreement" | "edge_conflict" | "low_confidence" | "student_rationale_required";
  description: string;              // Human-readable conflict explanation
  details: {
    conflicting_nodes?: {
      node_id: string;
      module1_value: Record<string, unknown>;
      module2_value: Record<string, unknown>;
    }[];
    confidence_score?: "low" | "medium" | "high";
    student_rationale?: string;     // For Phase 5: student must explain their choice
  };
  status: "pending" | "reviewed" | "approved" | "rejected" | "resolved";
  reviewed_by?: string;             // admin user_id
  reviewed_at?: Date;
  admin_notes?: string;
  resolution?: "approve_module1" | "approve_module2" | "manual_merge" | "reject_both";
  created_at: Date;
  updated_at: Date;
}

// ========================================
// SCHEMA
// ========================================

const ReviewQueueSchema = new Schema({
  project_id: { type: Schema.Types.ObjectId, required: true, index: true },
  module_id: { type: Schema.Types.ObjectId, required: true, ref: "Module" },
  conflict_type: { 
    type: String, 
    enum: ["node_disagreement", "edge_conflict", "low_confidence", "student_rationale_required"],
    required: true
  },
  description: { type: String, required: true },
  details: {
    conflicting_nodes: [{
      node_id: { type: String },
      module1_value: { type: Schema.Types.Mixed },
      module2_value: { type: Schema.Types.Mixed }
    }],
    confidence_score: { type: String, enum: ["low", "medium", "high"] },
    student_rationale: { type: String }
  },
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "approved", "rejected", "resolved"],
    default: "pending",
    index: true
  },
  reviewed_by: { type: String },
  reviewed_at: { type: Date },
  admin_notes: { type: String },
  resolution: { 
    type: String, 
    enum: ["approve_module1", "approve_module2", "manual_merge", "reject_both"]
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamp on save
ReviewQueueSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Indexes for admin dashboard
ReviewQueueSchema.index({ status: 1, created_at: -1 }); // Pending items first
ReviewQueueSchema.index({ project_id: 1, status: 1 });

// ========================================
// MODEL
// ========================================

export const ReviewQueue = mongoose.models.ReviewQueue || 
  mongoose.model<IReviewQueueItem>("ReviewQueue", ReviewQueueSchema);

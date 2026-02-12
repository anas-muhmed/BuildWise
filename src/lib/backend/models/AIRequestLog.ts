/**
 * AIRequestLog Model
 * 
 * Purpose: Track all AI requests for observability and cost monitoring
 * 
 * Used by admin panel to show:
 * - Total requests
 * - Requests per mode
 * - Success/failure rates
 * - Validation pass rates
 */

import mongoose, { Model, Schema, Document } from "mongoose";

export interface IAIRequestLog extends Document {
  userId: string;
  mode: "student" | "generative" | "manual";
  intent: string;
  success: boolean;
  validationPassed: boolean;
  errorMessage?: string;
  timestamp: Date;
  durationMs?: number; // How long the request took
}

const AIRequestLogSchema = new Schema<IAIRequestLog>({
  userId: {
    type: String,
    required: true,
    index: true, // Index for fast queries by user
  },
  mode: {
    type: String,
    enum: ["student", "generative", "manual"],
    required: true,
    index: true, // Index for fast queries by mode
  },
  intent: {
    type: String,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
    index: true, // Index for fast queries by success
  },
  validationPassed: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Index for fast time-range queries
  },
  durationMs: {
    type: Number,
  },
});

// TTL index: Auto-delete logs older than 90 days (keep storage manageable)
AIRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AIRequestLog: Model<IAIRequestLog> =
  mongoose.models.AIRequestLog ||
  mongoose.model<IAIRequestLog>("AIRequestLog", AIRequestLogSchema);

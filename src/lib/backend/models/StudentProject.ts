// src/lib/backend/models/StudentProject.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IStudentProject extends Document {
  userId: mongoose.Types.ObjectId;
  appType: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  selectedFeatures: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any[];
  architecture: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    edges: any[];
  };
  explanations: string[];
  aiScore?: number | null;
  status: "draft" | "submitted" | "verified" | "flagged" | "deleted";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
  roles?: {
    id: string;
    title: string;
    description: string;
    tasks: string[];
    assignee?: mongoose.Types.ObjectId | null;
  }[];
  milestones?: {
    id: string;
    title: string;
    description: string;
    done: boolean;
  }[];
  // Privacy flag for LLM output storage
  storeRawLLMOutput?: boolean;
  // Optional: storage for raw LLM outputs when user opts in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawLLMOutputs?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentProjectSchema = new Schema<IStudentProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appType: { type: String, required: true },
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    selectedFeatures: { type: [String], default: [] },
    steps: { type: Schema.Types.Mixed, default: [] },
    architecture: { type: Schema.Types.Mixed, default: { nodes: [], edges: [] } },
    explanations: { type: [String], default: [] },
    aiScore: { type: Number, default: null },
    status: {
      type: String,
      enum: ["draft", "submitted", "verified", "flagged", "deleted"],
      default: "draft",
    },
    meta: { type: Schema.Types.Mixed, default: {} },

    // === NEW: role-based distribution (backward compatible) ===
    roles: {
      type: [
        {
          id: { type: String },
          title: { type: String },
          description: { type: String },
          tasks: { type: [String], default: [] },
          assignee: { type: Schema.Types.ObjectId, ref: "User", default: null },
        },
      ],
      default: [],
    },

    // === NEW: milestones (project checkpoints) ===
    milestones: {
      type: [
        {
          id: { type: String },
          title: { type: String },
          description: { type: String },
          done: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    
    // === NEW: Privacy opt-in for LLM output storage ===
    storeRawLLMOutput: { type: Boolean, default: false },
    
    // === NEW: Raw LLM outputs (only stored if user opts in) ===
    rawLLMOutputs: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

// Keep existing indexes
StudentProjectSchema.index({ userId: 1, createdAt: -1 });
StudentProjectSchema.index({ status: 1 });

// Export
export const StudentProject =
  mongoose.models.StudentProject ||
  mongoose.model<IStudentProject>("StudentProject", StudentProjectSchema);

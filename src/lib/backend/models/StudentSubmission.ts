import mongoose, { Schema, Document } from "mongoose";

export interface IStudentSubmission extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  architecture: { nodes: any[]; edges: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiFeedback?: { performance: number; security: number; cost: number; suggestions: string[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminFeedback?: { adminId?: mongoose.Types.ObjectId; note?: string; createdAt?: Date };
  status: "submitted"|"reviewed"|"verified"|"flagged";
  createdAt: Date;
}

const StudentSubmissionSchema = new Schema<IStudentSubmission>({
  projectId: { type: Schema.Types.ObjectId, ref: "StudentProject", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String },
  architecture: { type: Schema.Types.Mixed, required: true },
  aiFeedback: { type: Schema.Types.Mixed, default: {} },
  adminFeedback: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["submitted","reviewed","verified","flagged"], default: "submitted" },
}, { timestamps: true });

StudentSubmissionSchema.index({ projectId: 1 });
StudentSubmissionSchema.index({ userId: 1, status: 1 });

export const StudentSubmission = mongoose.models.StudentSubmission || mongoose.model("StudentSubmission", StudentSubmissionSchema);

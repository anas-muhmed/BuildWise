import mongoose, { Schema, Document, Model } from "mongoose";

export interface INode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface IEdge {
  source: string;
  target: string;
}

export interface IStudentProject extends Document {
  userId: mongoose.Types.ObjectId;
  appType: string;                     // e.g. "ecommerce" | "notes" | "attendance"
  skillLevel: "beginner"|"intermediate"|"advanced";
  selectedFeatures: string[];          // e.g. ["auth","crud","payments"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any[];
  architecture: { nodes: INode[]; edges: IEdge[] };
  explanations: string[];              // plain-language notes
  aiScore?: number;                    // 0-100 (mock)
  status: "draft"|"submitted"|"verified"|"flagged"|"deleted";
  createdAt: Date;
  updatedAt: Date;
}

const StudentProjectSchema = new Schema<IStudentProject>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  appType: { type: String, required: true },
  skillLevel: { type: String, enum: ["beginner","intermediate","advanced"], default: "beginner" },
  selectedFeatures: { type: [String], default: [] },
  steps: { type: Schema.Types.Mixed, default: [] },
  architecture: { type: Schema.Types.Mixed, default: { nodes: [], edges: [] } },
  explanations: { type: [String], default: [] },
  aiScore: { type: Number, default: null },
  status: { type: String, enum: ["draft","submitted","verified","flagged","deleted"], default: "draft" },
}, { timestamps: true });

StudentProjectSchema.index({ userId: 1, status: 1 });
StudentProjectSchema.index({ appType: 1 });

export const StudentProject: Model<IStudentProject> =
  mongoose.models.StudentProject || mongoose.model<IStudentProject>("StudentProject", StudentProjectSchema);

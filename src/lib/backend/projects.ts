// src/lib/backend/projects.ts
import mongoose from "mongoose";

export interface Member {
  name: string;
  email: string;
  skill_tags: { name: string; level?: string; score?: number }[];
  primary_roles?: string[];
  availability_hours_per_week?: number;
}

export interface StudentProjectDoc extends mongoose.Document {
  title: string;
  elevator?: string;
  must_have_features: string[];
  constraints: string[];
  team_size: number;
  distribution_mode?: string;
  members: Member[];
  status: string;
  lastError?: string;
  privacy_opt_in?: boolean; // RBAC: Allow storing raw LLM outputs
  // Required fields from original StudentProject model
  appType?: string;
  skillLevel?: string;
  userId?: string | mongoose.Types.ObjectId;
  selectedFeatures?: string[];
  storeRawLLMOutput?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProjectSchema = new mongoose.Schema<StudentProjectDoc>({
  title: String,
  elevator: String,
  must_have_features: { type: [String], default: [] },
  constraints: { type: [String], default: [] },
  team_size: { type: Number, default: 1 },
  distribution_mode: String,
  members: {
    type: [{
      name: String,
      email: String,
      skill_tags: [{ name: String, level: String, score: Number }],
      primary_roles: [String],
      availability_hours_per_week: Number,
      strengths: [String],
      weaknesses: [String]
    }],
    default: []
  },
  status: { type: String, default: "draft" },
  lastError: String,
  privacy_opt_in: { type: Boolean, default: false }, // RBAC: Default no raw LLM storage
  // Add optional fields from original StudentProject model (not required for new flow)
  appType: String,
  skillLevel: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  selectedFeatures: { type: [String], default: [] },
  storeRawLLMOutput: { type: Boolean, default: false },
}, { timestamps: true });

// Delete cached model to force reload with new schema
if (mongoose.models.StudentProject) {
  delete mongoose.models.StudentProject;
}
export const StudentProject = mongoose.model<StudentProjectDoc>("StudentProject", StudentProjectSchema);

export async function saveProject(payload: Partial<StudentProjectDoc>) {
  console.log('[saveProject] BEFORE creating doc, payload.members:', payload.members);
  const doc = new StudentProject(payload);
  console.log('[saveProject] AFTER creating doc, doc.members:', doc.members);
  console.log('[saveProject] doc.members length:', (doc.members || []).length);
  
  // Mark Mixed type fields as modified so Mongoose saves them
  if (payload.members) {
    doc.markModified('members');
  }
  
  await doc.save();
  console.log('[saveProject] AFTER save, doc.members:', doc.members);
  console.log('[saveProject] AFTER save, doc.members length:', (doc.members || []).length);
  
  const json = doc.toJSON();
  console.log('[saveProject] AFTER toJSON, json.members:', json.members);
  
  return json;
}

export async function getProjectById(id: string) {
  return StudentProject.findById(id).lean().exec();
}

export async function updateProject(id: string, patch: Partial<StudentProjectDoc>) {
  return StudentProject.findByIdAndUpdate(id, patch, { new: true }).lean().exec();
}
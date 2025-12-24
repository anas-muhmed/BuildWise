// src/lib/backend/models/Audit.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAudit extends Document {
  projectId: string;
  conflictId: string;
  action: string;
  actor?: string;
  details?: any;
  createdAt: Date;
}

const AuditSchema = new Schema<IAudit>({
  projectId: { type: String, required: true, index: true },
  conflictId: { type: String, required: true },
  action: { type: String, required: true },
  actor: { type: String },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const AuditModel: Model<IAudit> = (mongoose.models.Audit as Model<IAudit>) || mongoose.model<IAudit>("Audit", AuditSchema);

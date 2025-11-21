import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId;
  designId?: mongoose.Types.ObjectId;
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
  adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  designId: { type: Schema.Types.ObjectId, ref: "Design" },
  action: { type: String, required: true },
  meta: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

AdminLogSchema.index({ adminId: 1 });
AdminLogSchema.index({ designId: 1 });
AdminLogSchema.index({ createdAt: -1 });

export const AdminLog: Model<IAdminLog> = 
  mongoose.models.AdminLog || mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);
// src/lib/backend/audit.ts
import mongoose from "mongoose";
import { connectDB } from "./mongodb";

export interface AuditEntry {
  projectId: string;
  actor: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: number;
}

const auditSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Number, required: true, default: Date.now }
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditSchema);

export async function appendAudit(
  projectId: string,
  entry: { actor: string; action: string; details?: Record<string, unknown> }
): Promise<void> {
  await connectDB();
  await AuditLog.create({
    projectId,
    actor: entry.actor,
    action: entry.action,
    details: entry.details || {},
    timestamp: Date.now()
  });
}

export async function getAuditLogs(projectId: string): Promise<AuditEntry[]> {
  await connectDB();
  const logs = await AuditLog.find({ projectId }).sort({ timestamp: -1 }).limit(100).lean();
  return logs as AuditEntry[];
}

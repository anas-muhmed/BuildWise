// lib/backend/models/Module.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// 🎯 MASTER'S STUDENT MODE V2.5 - Module Model
// Each Module represents a feature-level architecture unit

// ========================================
// INTERFACES (MASTER'S CANONICAL TYPES)
// ========================================

export type Confidence = "high" | "medium" | "low";

export interface ModuleNode {
  id: string;
  type: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface ModuleEdge {
  from: string;
  to: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

export interface ProposedEdit {
  id: string;
  author: string;
  diff: {
    nodes?: ModuleNode[];
    edges?: ModuleEdge[];
  };
  createdAt: Date;
  status?: "open" | "accepted" | "rejected";
}

// Type aliases for backward compatibility
export type IModuleNode = ModuleNode;
export type IModuleEdge = ModuleEdge;

export interface IModule extends Document {
  projectId: string;              // MASTER: Simplified from ObjectId for compatibility
  name: string;
  description?: string;
  order: number;
  status: "proposed" | "approved" | "modified" | "rejected";
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  rationale?: string;
  ai_feedback?: {
    confidence?: Confidence;
    alternatives?: string[];
    resources?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_llm_output?: any;
  };
  
  // Approval workflow fields
  approvedBy?: string;
  approvedAt?: Date;
  
  // Metadata
  meta?: {
    createdBy?: string;
    createdAt?: Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [k: string]: any;
  };
  
  // Proposed edits from students
  proposedEdits?: ProposedEdit[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // Keep old fields for backward compatibility
  project_id?: mongoose.Types.ObjectId;
  created_by?: string;
  approved_by?: string;
  version?: number;
  created_at?: Date;
  updated_at?: Date;
}

// ========================================
// NODE TYPE WHITELIST (Master's Final List)
// ========================================

export const NODE_TYPES = [
  "client",
  "frontend",
  "gateway",
  "service",
  "database",
  "cache",
  "queue",
  "messaging",
  "auth",
  "blob_storage",
  "search",
  "realtime",
  "worker",
  "monitoring",
  "cdn"
] as const;

export type NodeType = typeof NODE_TYPES[number];

// ========================================
// CANONICAL NODE IDS (Master's Final List)
// ========================================

export const CANONICAL_NODE_IDS = [
  "mobile_app",
  "web_app",
  "api_gateway",
  "auth_service",
  "order_service",
  "payment_service",
  "tracking_service",
  "notification_service",
  "user_service",
  "product_service",
  "restaurant_service",
  "delivery_service",
  "database",
  "redis",
  "s3_bucket",
  "websocket_server",
  "message_queue",
  "cdn"
] as const;

export type CanonicalNodeId = typeof CANONICAL_NODE_IDS[number];

// ========================================
// SCHEMAS
// ========================================

// MASTER'S CANONICAL SCHEMAS
const NodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: String,
    meta: { type: Schema.Types.Mixed },
    position: { x: Number, y: Number }
  },
  { _id: false }
);

const EdgeSchema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    label: String,
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ProposedEditSchema = new Schema(
  {
    id: { type: String, required: true },
    author: String,
    diff: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["open", "accepted", "rejected"], default: "open" }
  },
  { _id: false }
);

const ModuleSchema = new Schema<IModule>(
  {
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    order: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["proposed","approved","modified","rejected"], default: "proposed" },
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },
    rationale: String,
    ai_feedback: { type: Schema.Types.Mixed },
    
    // Approval workflow fields
    approvedBy: String,
    approvedAt: Date,
    
    // Metadata
    meta: { type: Schema.Types.Mixed, default: {} },
    
    // Proposed edits array
    proposedEdits: { type: [ProposedEditSchema], default: [] },
    
    // Backward compatibility fields
    project_id: { type: Schema.Types.ObjectId },
    created_by: String,
    approved_by: String,
    version: { type: Number, default: 1 },
    created_at: Date,
    updated_at: Date,
  },
  { timestamps: true } // Auto-creates createdAt/updatedAt
);

// ========================================
// MODEL (MASTER'S PATTERN - AVOID OVERWRITE)
// ========================================

export const ModuleModel: Model<IModule> = (mongoose.models.Module as Model<IModule>) || mongoose.model<IModule>("Module", ModuleSchema);

// Export both for compatibility
export const Module = ModuleModel;

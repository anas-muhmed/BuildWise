// models/Design.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// Step 1: TypeScript interface
export interface IDesign extends Document {
  userId: mongoose.Types.ObjectId;  // Links to User who created it
  title?: string;                   // Optional: "Food Delivery App"
  prompt?: string;                  // Optional: What user typed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Record<string, any>[];     // Architecture nodes (flexible objects)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: Record<string, any>[];     // Connections between nodes
  createdAt: Date;
}

// Step 2: Mongoose schema
const DesignSchema = new Schema<IDesign>({
  userId: { 
    type: Schema.Types.ObjectId,   // Special MongoDB type for IDs
    ref: "User",                    // Links to User collection
    required: true 
  },
  title: { 
    type: String                    // Optional (no 'required: true')
  },
  prompt: { 
    type: String 
  },
  nodes: { 
    type: Schema.Types.Mixed,       // Flexible type (stores arrays/objects/any JSON)
    default: []                     // Empty array if not provided
  },
  edges: { 
    type: Schema.Types.Mixed,       // Flexible type (stores arrays/objects/any JSON)
    default: [] 
  },
}, { 
  timestamps: true 
});

// Step 3: Export model
export const Design: Model<IDesign> = 
  mongoose.models.Design || mongoose.model<IDesign>("Design", DesignSchema);
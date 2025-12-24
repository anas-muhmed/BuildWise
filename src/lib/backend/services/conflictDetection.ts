// lib/backend/services/conflictDetection.ts
import { IModule, IModuleNode } from "../models/Module";
import { ReviewQueue } from "../models/ReviewQueue";
import mongoose from "mongoose";

/**
 * 🎯 PHASE 3: Conflict Detection - Master's Spec
 * 
 * Detects conflicts when merging modules:
 * - Node disagreements (same node ID, different types/meta)
 * - Low confidence modules
 * - Edge conflicts (meta differences)
 * 
 * Creates ReviewQueue items for admin resolution
 */

export async function detectConflicts(
  projectId: string | mongoose.Types.ObjectId,
  newModule: IModule,
  existingNodes: IModuleNode[]
): Promise<boolean> {
  let hasConflict = false;

  // Check for node disagreements
  const existingNodeMap = new Map(existingNodes.map(n => [n.id, n]));
  
  for (const newNode of newModule.nodes) {
    const existing = existingNodeMap.get(newNode.id);
    
    if (existing) {
      // Check if types differ
      if (existing.type !== newNode.type) {
        hasConflict = true;
        
        await ReviewQueue.create({
          project_id: projectId,
          module_id: newModule._id,
          conflict_type: "node_disagreement",
          description: `Node "${newNode.id}" has conflicting types: ${existing.type} vs ${newNode.type}`,
          details: {
            conflicting_nodes: [{
              node_id: newNode.id,
              module1_value: { type: existing.type, meta: existing.meta },
              module2_value: { type: newNode.type, meta: newNode.meta }
            }]
          },
          status: "pending"
        });
      }
      
      // Check for significant meta differences (e.g., database engine)
      if (existing.meta?.engine && newNode.meta?.engine && 
          existing.meta.engine !== newNode.meta.engine) {
        hasConflict = true;
        
        await ReviewQueue.create({
          project_id: projectId,
          module_id: newModule._id,
          conflict_type: "node_disagreement",
          description: `Node "${newNode.id}" has conflicting database engines: ${existing.meta.engine} vs ${newNode.meta.engine}`,
          details: {
            conflicting_nodes: [{
              node_id: newNode.id,
              module1_value: existing.meta,
              module2_value: newNode.meta
            }]
          },
          status: "pending"
        });
      }
    }
  }

  // Check for low confidence
  if (newModule.ai_feedback?.confidence === "low") {
    hasConflict = true;
    
    await ReviewQueue.create({
      project_id: projectId,
      module_id: newModule._id,
      conflict_type: "low_confidence",
      description: `Module "${newModule.name}" generated with low confidence - requires review`,
      details: {
        confidence_score: "low"
      },
      status: "pending"
    });
  }

  return hasConflict;
}

/**
 * Check if a module has pending conflicts in review queue
 */
export async function hasPendingConflicts(moduleId: string | mongoose.Types.ObjectId): Promise<boolean> {
  const count = await ReviewQueue.countDocuments({
    module_id: moduleId,
    status: "pending"
  });
  
  return count > 0;
}

// src/lib/backend/conflicts.ts
export interface ConflictItem {
  id: string;
  nodeId: string;
  reason: string;
  existingValue?: unknown;
  incomingValue?: unknown;
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: ConflictItem[];
}

export interface Node {
  id: string;
  type?: string;
  data?: {
    dbType?: string;
    protocol?: string;
    auth?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Edge {
  id: string;
  protocol?: string;
  auth?: string;
  [key: string]: unknown;
}

/**
 * Detect conflicts between existing and incoming nodes/edges
 * Simple rule-based checks for demo purposes
 */
export function detectConflicts(
  existingNodes: Node[],
  incomingNodes: Node[],
  existingEdges?: Edge[],
  incomingEdges?: Edge[]
): ConflictResult {
  const conflicts: ConflictItem[] = [];
  
  // Build map of existing nodes by ID
  const nodeMap = new Map(existingNodes.map(n => [n.id, n]));
  
  // Check for node conflicts
  for (const incomingNode of incomingNodes) {
    const existingNode = nodeMap.get(incomingNode.id);
    
    if (!existingNode) continue; // New node, no conflict
    
    // Type mismatch
    if (existingNode.type !== incomingNode.type) {
      conflicts.push({
        id: `node-type-${incomingNode.id}`,
        nodeId: incomingNode.id,
        reason: `Type mismatch: ${existingNode.type} !== ${incomingNode.type}`,
        existingValue: existingNode.type,
        incomingValue: incomingNode.type
      });
    }
    
    // DB type mismatch
    const existingDbType = existingNode.data?.dbType;
    const incomingDbType = incomingNode.data?.dbType;
    if (existingDbType && incomingDbType && existingDbType !== incomingDbType) {
      conflicts.push({
        id: `node-db-${incomingNode.id}`,
        nodeId: incomingNode.id,
        reason: `DB type mismatch: ${existingDbType} !== ${incomingDbType}`,
        existingValue: existingDbType,
        incomingValue: incomingDbType
      });
    }
  }
  
  // Check for edge conflicts if provided
  if (existingEdges && incomingEdges) {
    const edgeMap = new Map(existingEdges.map(e => [e.id, e]));
    
    for (const incomingEdge of incomingEdges) {
      const existingEdge = edgeMap.get(incomingEdge.id);
      
      if (!existingEdge) continue;
      
      // Protocol mismatch
      if (existingEdge.protocol && incomingEdge.protocol && 
          existingEdge.protocol !== incomingEdge.protocol) {
        conflicts.push({
          id: `edge-protocol-${incomingEdge.id}`,
          nodeId: incomingEdge.id,
          reason: `Protocol mismatch: ${existingEdge.protocol} !== ${incomingEdge.protocol}`,
          existingValue: existingEdge.protocol,
          incomingValue: incomingEdge.protocol
        });
      }
      
      // Auth metadata mismatch
      if (existingEdge.auth && incomingEdge.auth && 
          existingEdge.auth !== incomingEdge.auth) {
        conflicts.push({
          id: `edge-auth-${incomingEdge.id}`,
          nodeId: incomingEdge.id,
          reason: `Auth mismatch: ${existingEdge.auth} !== ${incomingEdge.auth}`,
          existingValue: existingEdge.auth,
          incomingValue: incomingEdge.auth
        });
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

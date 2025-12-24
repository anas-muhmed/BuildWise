// Test Script: Conflict Detection
// Run: node scripts/testConflicts.js
// Note: This is a pure JS test that doesn't require the TS module
// The actual TypeScript implementation is in src/lib/backend/conflicts.ts

// Inline implementation for testing
function detectConflicts(existingNodes, incomingNodes, existingEdges, incomingEdges) {
  const conflicts = [];
  const nodeMap = new Map(existingNodes.map(n => [n.id, n]));
  
  for (const incomingNode of incomingNodes) {
    const existingNode = nodeMap.get(incomingNode.id);
    if (!existingNode) continue;
    
    if (existingNode.type !== incomingNode.type) {
      conflicts.push({
        id: `node-type-${incomingNode.id}`,
        nodeId: incomingNode.id,
        reason: `Type mismatch: ${existingNode.type} !== ${incomingNode.type}`,
        existingValue: existingNode.type,
        incomingValue: incomingNode.type
      });
    }
    
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
  
  if (existingEdges && incomingEdges) {
    const edgeMap = new Map(existingEdges.map(e => [e.id, e]));
    for (const incomingEdge of incomingEdges) {
      const existingEdge = edgeMap.get(incomingEdge.id);
      if (!existingEdge) continue;
      
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

console.log('🧪 TESTING CONFLICT DETECTION\n');

// Test 1: No conflicts
console.log('📝 Test 1: No Conflicts');
const existingNodes1 = [
  { id: 'node-1', type: 'service', data: { dbType: 'postgres' } },
  { id: 'node-2', type: 'database', data: {} }
];
const incomingNodes1 = [
  { id: 'node-3', type: 'api', data: {} }
];
const result1 = detectConflicts(existingNodes1, incomingNodes1);
console.log('Result:', result1);
if (!result1.hasConflicts) {
  console.log('✅ No conflicts detected (expected)\n');
} else {
  console.log('❌ Unexpected conflicts\n');
}

// Test 2: Type mismatch conflict
console.log('📝 Test 2: Type Mismatch');
const existingNodes2 = [
  { id: 'node-1', type: 'service', data: {} }
];
const incomingNodes2 = [
  { id: 'node-1', type: 'database', data: {} }
];
const result2 = detectConflicts(existingNodes2, incomingNodes2);
console.log('Result:', result2);
if (result2.hasConflicts && result2.conflicts[0].reason.includes('Type mismatch')) {
  console.log('✅ Type conflict detected (expected)\n');
} else {
  console.log('❌ Type conflict not detected\n');
}

// Test 3: DB type mismatch
console.log('📝 Test 3: DB Type Mismatch (Module A: Postgres, Module B: Mongo)');
const existingNodes3 = [
  { id: 'db-1', type: 'database', data: { dbType: 'postgres' } }
];
const incomingNodes3 = [
  { id: 'db-1', type: 'database', data: { dbType: 'mongo' } }
];
const result3 = detectConflicts(existingNodes3, incomingNodes3);
console.log('Result:', result3);
if (result3.hasConflicts && result3.conflicts[0].reason.includes('DB type mismatch')) {
  console.log('✅ DB type conflict detected (expected)\n');
} else {
  console.log('❌ DB type conflict not detected\n');
}

// Test 4: Edge protocol mismatch
console.log('📝 Test 4: Edge Protocol Mismatch');
const existingEdges = [
  { id: 'edge-1', protocol: 'REST', auth: 'JWT' }
];
const incomingEdges = [
  { id: 'edge-1', protocol: 'GraphQL', auth: 'JWT' }
];
const result4 = detectConflicts([], [], existingEdges, incomingEdges);
console.log('Result:', result4);
if (result4.hasConflicts && result4.conflicts[0].reason.includes('Protocol mismatch')) {
  console.log('✅ Protocol conflict detected (expected)\n');
} else {
  console.log('❌ Protocol conflict not detected\n');
}

// Test 5: Multiple conflicts
console.log('📝 Test 5: Multiple Conflicts');
const existingNodes5 = [
  { id: 'node-1', type: 'service', data: { dbType: 'postgres' } },
  { id: 'node-2', type: 'api', data: {} }
];
const incomingNodes5 = [
  { id: 'node-1', type: 'database', data: { dbType: 'mongo' } },
  { id: 'node-2', type: 'service', data: {} }
];
const result5 = detectConflicts(existingNodes5, incomingNodes5);
console.log('Result:', result5);
console.log(`Found ${result5.conflicts.length} conflicts`);
if (result5.conflicts.length >= 2) {
  console.log('✅ Multiple conflicts detected (expected)\n');
} else {
  console.log('❌ Not all conflicts detected\n');
}

console.log('✅ CONFLICT DETECTION TESTS COMPLETE');

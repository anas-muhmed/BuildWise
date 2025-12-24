// __tests__/lib/backend/services/mergeEngine.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { mergeModuleIntoSnapshot } from '@/lib/backend/services/mergeEngine';
import { ModuleNode, ModuleEdge } from '@/lib/backend/models/Module';
import { ArchitectureSnapshot } from '@/lib/backend/models/ArchitectureSnapshot';
import { Module } from '@/lib/backend/models/Module';
import { ReviewQueue } from '@/lib/backend/models/ReviewQueue';
import { AuditLog } from '@/lib/backend/models/DraftProject';
import { connectDB } from '@/lib/backend/mongodb';

/**
 * 🎯 Master's Unit Tests: Merge Engine
 * Tests node/edge deduplication and conflict detection
 */

describe('Merge Engine - Node/Edge Deduplication', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_123';

    // Clean test data
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
    await ReviewQueue.deleteMany({ project_id: projectId });
    await AuditLog.deleteMany({ project_id: projectId });
  });

  afterAll(async () => {
    // Cleanup
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
    await ReviewQueue.deleteMany({ project_id: projectId });
    await AuditLog.deleteMany({ project_id: projectId });
    await mongoose.connection.close();
  });

  it('should create initial snapshot (version 1) from first module', async () => {
    // Create first module
    const module1 = await Module.create({
      project_id: projectId,
      name: 'Module 1',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'mobile_app', type: 'client', label: 'Mobile App' },
        { id: 'api_gateway', type: 'gateway', label: 'API Gateway' }
      ],
      edges: [
        { from: 'mobile_app', to: 'api_gateway', label: 'HTTPS' }
      ],
      rationale: 'Test module',
      order: 1,
      version: 1
    });

    // Approve and merge
    const snapshot = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module1.toObject(),
      userId
    );

    expect(snapshot).toBeDefined();
    expect(snapshot.version).toBe(1);
    expect(snapshot.nodes).toHaveLength(2);
    expect(snapshot.edges).toHaveLength(1);
    expect(snapshot.modules).toContain(module1._id.toString());
  });

  it('should deduplicate nodes by ID when merging second module', async () => {
    // Create second module that shares api_gateway node
    const module2 = await Module.create({
      project_id: projectId,
      name: 'Module 2',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'api_gateway', type: 'gateway', label: 'API Gateway Updated' },
        { id: 'order_service', type: 'service', label: 'Order Service' },
        { id: 'database', type: 'database', label: 'Orders DB', meta: { engine: 'mongodb' } }
      ],
      edges: [
        { from: 'api_gateway', to: 'order_service' },
        { from: 'order_service', to: 'database' }
      ],
      rationale: 'Test module 2',
      order: 2,
      version: 1
    });

    const snapshot = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module2.toObject(),
      userId
    );

    expect(snapshot.version).toBe(2);
    
    // Should have 4 unique nodes (mobile_app, api_gateway, order_service, database)
    expect(snapshot.nodes).toHaveLength(4);
    
    // Check that api_gateway was deduped (not duplicated)
    const gatewayNodes = snapshot.nodes.filter((n: ModuleNode) => n.id === 'api_gateway');
    expect(gatewayNodes).toHaveLength(1);
    
    // Check that edges were deduped too
    expect(snapshot.edges).toHaveLength(3); // mobile->gateway, gateway->order, order->db
  });

  it('should shallow merge node meta when deduplicating', async () => {
    // Create module with updated meta for existing node
    const module3 = await Module.create({
      project_id: projectId,
      name: 'Module 3',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { 
          id: 'database', 
          type: 'database', 
          label: 'Orders DB', 
          meta: { 
            engine: 'mongodb',
            replication: 'replica-set',
            sharding: true
          } 
        }
      ],
      edges: [],
      rationale: 'Update DB meta',
      order: 3,
      version: 1
    });

    const snapshot = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module3.toObject(),
      userId
    );

    expect(snapshot).toBeDefined();
    
    const dbNode = snapshot.nodes.find((n: ModuleNode) => n.id === 'database');
    expect(dbNode).toBeDefined();
    expect(dbNode!.meta).toMatchObject({
      engine: 'mongodb',
      replication: 'replica-set',
      sharding: true
    });
  });

  it('should deduplicate edges by "from→to" key', async () => {
    // Try to add duplicate edge
    const module4 = await Module.create({
      project_id: projectId,
      name: 'Module 4',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'mobile_app', type: 'client', label: 'Mobile App' },
        { id: 'api_gateway', type: 'gateway', label: 'API Gateway' }
      ],
      edges: [
        { from: 'mobile_app', to: 'api_gateway', label: 'HTTPS (duplicate attempt)' }
      ],
      rationale: 'Test edge dedupe',
      order: 4,
      version: 1
    });

    const snapshot = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module4.toObject(),
      userId
    );

    expect(snapshot).toBeDefined();
    
    // Should still have only 3 unique edges
    expect(snapshot.edges).toHaveLength(3);
    
    // Check that duplicate edge was deduped
    const mobileToGatewayEdges = snapshot.edges.filter(
      (e: ModuleEdge) => e.from === 'mobile_app' && e.to === 'api_gateway'
    );
    expect(mobileToGatewayEdges).toHaveLength(1);
  });
});

describe('Merge Engine - Conflict Detection', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_conflict';

    // Clean test data
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
    await ReviewQueue.deleteMany({ project_id: projectId });
    await AuditLog.deleteMany({ project_id: projectId });

    // Create base snapshot with postgres database
    const baseModule = await Module.create({
      project_id: projectId,
      name: 'Base Module',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'api_gateway', type: 'gateway', label: 'API Gateway' },
        { id: 'database', type: 'database', label: 'Primary DB', meta: { engine: 'postgres' } }
      ],
      edges: [
        { from: 'api_gateway', to: 'database' }
      ],
      rationale: 'Base',
      order: 1,
      version: 1
    });

    await mergeModuleIntoSnapshot(projectId.toString(), baseModule.toObject(), userId);
  });

  afterAll(async () => {
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
    await ReviewQueue.deleteMany({ project_id: projectId });
    await AuditLog.deleteMany({ project_id: projectId });
  });

  it.skip('should detect node type mismatch conflict', async () => {
    // Try to change database type from 'database' to 'service'
    const conflictModule = await Module.create({
      project_id: projectId,
      name: 'Conflict Module',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'database', type: 'service', label: 'DB Service' } // Type conflict!
      ],
      edges: [],
      rationale: 'This should conflict',
      order: 2,
      version: 1
    });

    const result = await mergeModuleIntoSnapshot(
      projectId.toString(),
      conflictModule.toObject(),
      userId
    );

    expect(result.ok).toBe(false);
    expect(result.requires_admin).toBe(true);
    expect(result.conflicts).toBeDefined();
    expect(result.conflicts!.length).toBeGreaterThan(0);
    
    const typeConflict = result.conflicts!.find((c: any) => c.type === 'node_type_mismatch');
    expect(typeConflict).toBeDefined();
    expect(typeConflict!.message).toContain('database');
  });

  it.skip('should detect database engine conflict (plurality)', async () => {
    // Try to add MongoDB database when postgres already exists
    const dbConflictModule = await Module.create({
      project_id: projectId,
      name: 'MongoDB Module',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'mongo_db', type: 'database', label: 'MongoDB', meta: { engine: 'mongodb' } }
      ],
      edges: [],
      rationale: 'Add MongoDB',
      order: 3,
      version: 1
    });

    const result = await mergeModuleIntoSnapshot(
      projectId.toString(),
      dbConflictModule.toObject(),
      userId
    );

    expect(result.ok).toBe(false);
    expect(result.requires_admin).toBe(true);
    
    const dbPlurality = result.conflicts!.find((c: any) => c.type === 'database_plurality');
    expect(dbPlurality).toBeDefined();
    expect(dbPlurality!.message).toContain('Multiple database engines');
  });

  it.skip('should detect gateway plurality conflict', async () => {
    // Try to add second API gateway
    const gatewayModule = await Module.create({
      project_id: projectId,
      name: 'Second Gateway',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'api_gateway_2', type: 'gateway', label: 'Second Gateway' }
      ],
      edges: [],
      rationale: 'Add second gateway',
      order: 4,
      version: 1
    });

    const result = await mergeModuleIntoSnapshot(
      projectId.toString(),
      gatewayModule.toObject(),
      userId
    );

    expect(result.ok).toBe(false);
    expect(result.requires_admin).toBe(true);
    
    const gatewayPlurality = result.conflicts!.find((c: any) => c.type === 'gateway_plurality');
    expect(gatewayPlurality).toBeDefined();
    expect(gatewayPlurality!.message).toContain('Multiple API gateway');
  });

  it.skip('should create ReviewQueue entry when conflicts detected', async () => {
    const conflictModule = await Module.create({
      project_id: projectId,
      name: 'Review Queue Test',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'database', type: 'cache', label: 'Wrong type' } // Conflict
      ],
      edges: [],
      rationale: 'Test review queue',
      order: 5,
      version: 1
    });

    const result = await mergeModuleIntoSnapshot(
      projectId.toString(),
      conflictModule.toObject(),
      userId
    );

    expect(result.ok).toBe(false);
    expect(result.review_id).toBeDefined();

    // Check ReviewQueue was created
    const reviewItem = await ReviewQueue.findById(result.review_id);
    expect(reviewItem).toBeDefined();
    expect(reviewItem!.status).toBe('pending');
    expect(reviewItem!.conflicts.length).toBeGreaterThan(0);
    expect(reviewItem!.module_id.toString()).toBe(conflictModule._id.toString());
  });

  it.skip('should create AuditLog entry for conflicts', async () => {
    const conflictModule = await Module.create({
      project_id: projectId,
      name: 'Audit Log Test',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'api_gateway_3', type: 'gateway', label: 'Third Gateway' }
      ],
      edges: [],
      rationale: 'Test audit log',
      order: 6,
      version: 1
    });

    await mergeModuleIntoSnapshot(
      projectId.toString(),
      conflictModule.toObject(),
      userId
    );

    const auditEntry = await AuditLog.findOne({
      project_id: projectId,
      action: 'module_requires_admin'
    }).sort({ timestamp: -1 });

    expect(auditEntry).toBeDefined();
    expect(auditEntry!.by).toBe(userId);
    expect(auditEntry!.reason).toBe('merge conflicts');
  });
});

describe('Merge Engine - Snapshot Immutability', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_immutable';

    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
  });

  afterAll(async () => {
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
  });

  it('should create new snapshot document on each merge (immutability)', async () => {
    // Create and merge module 1
    const module1 = await Module.create({
      project_id: projectId,
      name: 'Immutable Test 1',
      status: 'proposed',
      created_by: userId,
      nodes: [{ id: 'node1', type: 'service', label: 'Service 1' }],
      edges: [],
      rationale: 'Test',
      order: 1,
      version: 1
    });

    const snapshot1 = await mergeModuleIntoSnapshot(projectId.toString(), module1.toObject(), userId);
    const snapshot1Id = snapshot1._id;

    // Create and merge module 2
    const module2 = await Module.create({
      project_id: projectId,
      name: 'Immutable Test 2',
      status: 'proposed',
      created_by: userId,
      nodes: [{ id: 'node2', type: 'service', label: 'Service 2' }],
      edges: [],
      rationale: 'Test 2',
      order: 2,
      version: 1
    });

    const snapshot2 = await mergeModuleIntoSnapshot(projectId.toString(), module2.toObject(), userId);
    const snapshot2Id = snapshot2._id;

    // Verify different snapshot documents
    expect(snapshot1Id.toString()).not.toBe(snapshot2Id.toString());
    
    // Verify both snapshots exist in DB
    const allSnapshots = await ArchitectureSnapshot.find({ project_id: projectId });
    expect(allSnapshots.length).toBeGreaterThanOrEqual(2);
    
    // Verify only latest is active
    const activeSnapshots = allSnapshots.filter(s => s.active);
    expect(activeSnapshots).toHaveLength(1);
    expect(activeSnapshots[0]._id.toString()).toBe(snapshot2Id.toString());
  });

  it('should increment version number on each merge', async () => {
    const snapshots = await ArchitectureSnapshot.find({ project_id: projectId })
      .sort({ version: 1 });
    
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(snapshots[0].version).toBe(1);
    expect(snapshots[1].version).toBe(2);
  });

  it('should deactivate previous snapshots when creating new one', async () => {
    const inactiveSnapshots = await ArchitectureSnapshot.find({
      project_id: projectId,
      active: false
    });

    expect(inactiveSnapshots.length).toBeGreaterThanOrEqual(1);
  });
});

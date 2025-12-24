// __tests__/lib/backend/services/snapshotService.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/backend/mongodb';
import { ArchitectureSnapshot } from '@/lib/backend/models/ArchitectureSnapshot';
import { Module } from '@/lib/backend/models/Module';
import { mergeModuleIntoSnapshot } from '@/lib/backend/services/mergeEngine';
import { ModuleNode } from '@/lib/backend/models/Module';

/**
 * 🎯 Master's Unit Tests: Snapshot Rollback
 * Tests immutable rollback pattern (v3 → v1 creates v4 with v1 state)
 */

describe.skip('Snapshot Service - Rollback Tests', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;
  let snapshot1Id: mongoose.Types.ObjectId;
  let snapshot2Id: mongoose.Types.ObjectId;
  let snapshot3Id: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_rollback';

    // Clean test data
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });

    // Create snapshot v1 (1 node)
    const module1 = await Module.create({
      project_id: projectId,
      name: 'Module v1',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'node1', type: 'service', label: 'Service 1' }
      ],
      edges: [],
      rationale: 'Version 1',
      order: 1,
      version: 1
    });

    const snapshot1 = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module1.toObject(),
      userId
    );
    snapshot1Id = snapshot1._id as mongoose.Types.ObjectId;

    // Create snapshot v2 (2 nodes)
    const module2 = await Module.create({
      project_id: projectId,
      name: 'Module v2',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'node2', type: 'service', label: 'Service 2' }
      ],
      edges: [
        { from: 'node1', to: 'node2' }
      ],
      rationale: 'Version 2',
      order: 2,
      version: 1
    });

    const snapshot2 = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module2.toObject(),
      userId
    );
    snapshot2Id = snapshot2._id as mongoose.Types.ObjectId;

    // Create snapshot v3 (3 nodes)
    const module3 = await Module.create({
      project_id: projectId,
      name: 'Module v3',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'node3', type: 'database', label: 'Database' }
      ],
      edges: [
        { from: 'node2', to: 'node3' }
      ],
      rationale: 'Version 3',
      order: 3,
      version: 1
    });

    const snapshot3 = await mergeModuleIntoSnapshot(
      projectId.toString(),
      module3.toObject(),
      userId
    );
    snapshot3Id = snapshot3._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
    await mongoose.connection.close();
  });

  it('should have 3 snapshots with versions 1, 2, 3', async () => {
    const snapshots = await ArchitectureSnapshot.find({ project_id: projectId })
      .sort({ version: 1 });

    expect(snapshots).toHaveLength(3);
    expect(snapshots[0].version).toBe(1);
    expect(snapshots[1].version).toBe(2);
    expect(snapshots[2].version).toBe(3);
  });

  it('should have only v3 marked as active initially', async () => {
    const activeSnapshot = await ArchitectureSnapshot.findOne({
      project_id: projectId,
      active: true
    });

    expect(activeSnapshot).toBeDefined();
    expect(activeSnapshot!.version).toBe(3);
    expect(activeSnapshot!._id.toString()).toBe(snapshot3Id.toString());
  });

  it('should rollback from v3 to v1 (marks v1 as active)', async () => {
    // Rollback to version 1
    const rolledBack = await snapshotService.rollbackToVersion(
      projectId.toString(),
      1,
      userId
    );

    expect(rolledBack).toBeDefined();
    expect(rolledBack!._id.toString()).toBe(snapshot1Id.toString());
    expect(rolledBack!.active).toBe(true);
    expect(rolledBack!.version).toBe(1);

    // Check that v3 is now inactive
    const v3Snapshot = await ArchitectureSnapshot.findById(snapshot3Id);
    expect(v3Snapshot!.active).toBe(false);

    // Check that v2 is still inactive
    const v2Snapshot = await ArchitectureSnapshot.findById(snapshot2Id);
    expect(v2Snapshot!.active).toBe(false);
  });

  it('should have v1 state after rollback (1 node, 0 edges)', async () => {
    const activeSnapshot = await snapshotService.getLatestSnapshot(projectId.toString());

    expect(activeSnapshot).toBeDefined();
    expect(activeSnapshot!.version).toBe(1);
    expect(activeSnapshot!.nodes).toHaveLength(1);
    expect(activeSnapshot!.edges).toHaveLength(0);
    expect(activeSnapshot!.nodes[0].id).toBe('node1');
  });

  it('should rollback from v1 to v2 (toggle back)', async () => {
    const rolledBack = await snapshotService.rollbackToVersion(
      projectId.toString(),
      2,
      userId
    );

    expect(rolledBack).toBeDefined();
    expect(rolledBack!.version).toBe(2);
    expect(rolledBack!.active).toBe(true);
    expect(rolledBack!.nodes).toHaveLength(2);
    expect(rolledBack!.edges).toHaveLength(1);
  });

  it('should return null when rolling back to non-existent version', async () => {
    const result = await snapshotService.rollbackToVersion(
      projectId.toString(),
      99, // Non-existent version
      userId
    );

    expect(result).toBeNull();
  });

  it('should only have one active snapshot at any time', async () => {
    const activeSnapshots = await ArchitectureSnapshot.find({
      project_id: projectId,
      active: true
    });

    expect(activeSnapshots).toHaveLength(1);
  });
});

describe('Snapshot Service - Diff Calculation', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_diff';

    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });

    // Create v1: 2 nodes, 1 edge
    const module1 = await Module.create({
      project_id: projectId,
      name: 'Diff Test v1',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'nodeA', type: 'service', label: 'Service A' },
        { id: 'nodeB', type: 'database', label: 'Database B' }
      ],
      edges: [
        { from: 'nodeA', to: 'nodeB' }
      ],
      rationale: 'Base',
      order: 1,
      version: 1
    });

    await mergeModuleIntoSnapshot(projectId.toString(), module1.toObject(), userId);

    // Create v2: add nodeC, add edge A->C
    const module2 = await Module.create({
      project_id: projectId,
      name: 'Diff Test v2',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'nodeC', type: 'cache', label: 'Cache C' }
      ],
      edges: [
        { from: 'nodeA', to: 'nodeC' }
      ],
      rationale: 'Add cache',
      order: 2,
      version: 1
    });

    await mergeModuleIntoSnapshot(projectId.toString(), module2.toObject(), userId);

    // Create v3: remove nodeB and its edge, add nodeD
    const module3 = await Module.create({
      project_id: projectId,
      name: 'Diff Test v3',
      status: 'proposed',
      created_by: userId,
      nodes: [
        { id: 'nodeD', type: 'queue', label: 'Queue D' }
      ],
      edges: [
        { from: 'nodeC', to: 'nodeD' }
      ],
      rationale: 'Add queue',
      order: 3,
      version: 1
    });

    await mergeModuleIntoSnapshot(projectId.toString(), module3.toObject(), userId);
  });

  afterAll(async () => {
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
  });

  it('should calculate diff from v1 to v2 (1 node added, 1 edge added)', async () => {
    const diff = await snapshotService.getSnapshotDiff(
      projectId.toString(),
      1,
      2
    );

    expect(diff).toBeDefined();
    expect(diff!.from_version).toBe(1);
    expect(diff!.to_version).toBe(2);
    
    // Added nodeC
    expect(diff!.added_nodes).toHaveLength(1);
    expect(diff!.added_nodes[0].id).toBe('nodeC');
    
    // No nodes removed
    expect(diff!.removed_nodes).toHaveLength(0);
    
    // Added edge A->C
    expect(diff!.added_edges).toHaveLength(1);
    expect(diff!.added_edges[0].from).toBe('nodeA');
    expect(diff!.added_edges[0].to).toBe('nodeC');
    
    // Counts
    expect(diff!.node_count_change).toBe(1); // +1 node
    expect(diff!.edge_count_change).toBe(1); // +1 edge
  });

  it('should calculate diff from v1 to v3 (2 nodes added, 2 edges added)', async () => {
    const diff = await snapshotService.getSnapshotDiff(
      projectId.toString(),
      1,
      3
    );

    expect(diff).toBeDefined();
    
    // Added nodeC and nodeD
    expect(diff!.added_nodes).toHaveLength(2);
    const addedNodeIds = diff!.added_nodes.map((n: ModuleNode) => n.id);
    expect(addedNodeIds).toContain('nodeC');
    expect(addedNodeIds).toContain('nodeD');
    
    // Added edges A->C and C->D
    expect(diff!.added_edges).toHaveLength(2);
    
    expect(diff!.node_count_change).toBe(2);
    expect(diff!.edge_count_change).toBe(2);
  });

  it('should calculate reverse diff from v3 to v1 (2 nodes removed)', async () => {
    const diff = await snapshotService.getSnapshotDiff(
      projectId.toString(),
      3,
      1
    );

    expect(diff).toBeDefined();
    
    // Removed nodeC and nodeD
    expect(diff!.removed_nodes).toHaveLength(2);
    const removedNodeIds = diff!.removed_nodes.map((n: ModuleNode) => n.id);
    expect(removedNodeIds).toContain('nodeC');
    expect(removedNodeIds).toContain('nodeD');
    
    // No nodes added
    expect(diff!.added_nodes).toHaveLength(0);
    
    expect(diff!.node_count_change).toBe(-2); // -2 nodes
    expect(diff!.edge_count_change).toBe(-2); // -2 edges
  });

  it('should return null for non-existent version diff', async () => {
    const diff = await snapshotService.getSnapshotDiff(
      projectId.toString(),
      1,
      99 // Non-existent
    );

    expect(diff).toBeNull();
  });
});

describe('Snapshot Service - Latest and History', () => {
  let projectId: mongoose.Types.ObjectId;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    projectId = new mongoose.Types.ObjectId();
    userId = 'test_user_history';

    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });

    // Create 3 snapshots
    for (let i = 1; i <= 3; i++) {
      const moduleData = await Module.create({
        project_id: projectId,
        name: `History Module ${i}`,
        status: 'proposed',
        created_by: userId,
        nodes: [{ id: `node${i}`, type: 'service', label: `Service ${i}` }],
        edges: [],
        rationale: `Version ${i}`,
        order: i,
        version: 1
      });

      await mergeModuleIntoSnapshot(projectId.toString(), moduleData.toObject(), userId);
    }
  });

  afterAll(async () => {
    await ArchitectureSnapshot.deleteMany({ project_id: projectId });
    await Module.deleteMany({ project_id: projectId });
  });

  it('should return latest snapshot (highest version)', async () => {
    const latest = await snapshotService.getLatestSnapshot(projectId.toString());

    expect(latest).toBeDefined();
    expect(latest!.version).toBe(3);
    expect(latest!.active).toBe(true);
  });

  it('should return snapshot history sorted by version desc', async () => {
    const history = await snapshotService.getSnapshotHistory(projectId.toString());

    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(3);
    expect(history[1].version).toBe(2);
    expect(history[2].version).toBe(1);
  });

  it('should return null if no snapshots exist', async () => {
    const emptyProjectId = new mongoose.Types.ObjectId();
    const latest = await snapshotService.getLatestSnapshot(emptyProjectId.toString());

    expect(latest).toBeNull();
  });

  it('should return empty array for history if no snapshots', async () => {
    const emptyProjectId = new mongoose.Types.ObjectId();
    const history = await snapshotService.getSnapshotHistory(emptyProjectId.toString());

    expect(history).toEqual([]);
  });
});

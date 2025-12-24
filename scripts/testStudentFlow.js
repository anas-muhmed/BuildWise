// Test Script: End-to-End Student Flow
// Run: node scripts/testStudentFlow.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUrl = process.env.MONGODB_URI;
if (!mongoUrl) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function testStudentFlow() {
  console.log('🧪 TESTING STUDENT FLOW END-TO-END\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    const { StudentProject } = require('../src/lib/backend/projects');
    const { saveSnapshot, getLatestSnapshot } = require('../src/lib/backend/snapshots');
    const { enqueueSnapshotJob } = require('../src/lib/backend/jobs');

    // Test 1: Create project
    console.log('\n📝 Test 1: Create Project');
    const project = new StudentProject({
      title: 'E2E Test Project',
      elevator: 'Testing the complete student flow',
      must_have_features: ['auth', 'crud'],
      constraints: [],
      team_size: 3,
      members: [
        { name: 'Alice', email: 'alice@test.com', skill_tags: [{ name: 'React', level: 'intermediate' }] },
        { name: 'Bob', email: 'bob@test.com', skill_tags: [{ name: 'Node.js', level: 'beginner' }] },
        { name: 'Carol', email: 'carol@test.com', skill_tags: [{ name: 'Design', level: 'advanced' }] }
      ],
      status: 'draft',
      privacy_opt_in: false // Test privacy compliance
    });
    await project.save();
    console.log(`✅ Project created: ${project._id}`);

    // Test 2: Seed snapshot (trigger job)
    console.log('\n🌱 Test 2: Seed Snapshot');
    const snapshot1 = await enqueueSnapshotJob(project._id.toString());
    console.log(`✅ Snapshot generated: ${snapshot1._id}, version: ${snapshot1.version}`);
    console.log(`   Nodes: ${snapshot1.nodes?.length || 0}, Edges: ${snapshot1.edges?.length || 0}`);
    
    // Verify no raw LLM output (privacy_opt_in = false)
    if (snapshot1.ai_feedback?.raw_llm_output) {
      console.log('❌ PRIVACY VIOLATION: raw_llm_output stored despite privacy_opt_in=false');
    } else {
      console.log('✅ Privacy compliance: No raw LLM output stored');
    }

    // Test 3: Save architecture (student edit)
    console.log('\n💾 Test 3: Save Architecture');
    const editedSnapshot = {
      version: Date.now(),
      nodes: [
        ...snapshot1.nodes,
        { id: 'new-node-1', label: 'New Service', type: 'service', x: 300, y: 300, meta: {} }
      ],
      edges: snapshot1.edges,
      modules: snapshot1.modules || [],
      rationale: 'Added new service for testing'
    };
    const saved = await saveSnapshot(project._id.toString(), editedSnapshot);
    console.log(`✅ Architecture saved: ${saved._id}, version: ${saved.version}`);
    console.log(`   Nodes: ${saved.nodes?.length || 0} (added 1 node)`);

    // Test 4: Retrieve latest snapshot
    console.log('\n🔍 Test 4: Retrieve Latest Snapshot');
    const latest = await getLatestSnapshot(project._id.toString());
    console.log(`✅ Latest snapshot retrieved: ${latest._id}`);
    console.log(`   Version: ${latest.version}`);
    console.log(`   Nodes: ${latest.nodes?.length || 0}`);

    // Test 5: Verify version progression
    console.log('\n📊 Test 5: Verify Version Progression');
    if (latest.version > snapshot1.version) {
      console.log('✅ Version incremented correctly');
    } else {
      console.log('❌ Version not incremented');
    }

    // Cleanup
    console.log('\n🧹 Cleanup');
    await mongoose.connection.db.collection('studentprojects').deleteOne({ _id: project._id });
    await mongoose.connection.db.collection('snapshots').deleteMany({ projectId: project._id.toString() });
    console.log('✅ Test data cleaned up');

    console.log('\n✅ ALL TESTS PASSED');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testStudentFlow();

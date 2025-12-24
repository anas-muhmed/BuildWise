// scripts/simpleTest.js
// Direct test without needing auth - creates project and snapshot in MongoDB directly

const mongoose = require('mongoose');

const StudentProjectSchema = new mongoose.Schema({
  title: String,
  elevator: String,
  must_have_features: [String],
  constraints: [String],
  team_size: Number,
  members: [mongoose.Schema.Types.Mixed],
  status: String,
}, { timestamps: true });

const SnapshotSchema = new mongoose.Schema({
  projectId: String,
  version: Number,
  nodes: Array,
  edges: Array,
  modules: Array,
  rationale: String,
  ai_feedback: Object,
}, { timestamps: true });

const StudentProject = mongoose.models.StudentProject || mongoose.model('StudentProject', StudentProjectSchema);
const Snapshot = mongoose.models.Snapshot || mongoose.model('Snapshot', SnapshotSchema);

function getSimpleMockSnapshot() {
  return {
    version: Date.now(),
    nodes: [
      { id: "mobile_app", type: "client", label: "Mobile App", x: 120, y: 100, meta: { platform: "React Native" } },
      { id: "api_gateway", type: "gateway", label: "API Gateway", x: 420, y: 100, meta: { type: "Kong" } },
      { id: "auth_service", type: "auth", label: "Auth Service", x: 720, y: 100, meta: { strategy: "JWT" } },
      { id: "user_database", type: "database", label: "User Database", x: 1020, y: 100, meta: { engine: "mongodb" } }
    ],
    edges: [
      { from: "mobile_app", to: "api_gateway", label: "HTTPS" },
      { from: "api_gateway", to: "auth_service", label: "Auth endpoints" },
      { from: "auth_service", to: "user_database", label: "User CRUD" }
    ],
    modules: ["auth"],
    rationale: "Authentication module with mobile app, API gateway, auth service, and database",
    ai_feedback: { confidence: "high" }
  };
}

function normalizeSnapshot(raw) {
  const s = { ...raw };
  s.version = s.version ?? Date.now();
  s.nodes = (s.nodes || []).map(n => ({
    id: String(n.id ?? n._id ?? `node-${Math.floor(Math.random()*1e9)}`),
    label: n.label ?? n.name ?? "node",
    type: n.type ?? "service",
    x: typeof n.x === "number" ? n.x : 0,
    y: typeof n.y === "number" ? n.y : 0,
    meta: n.meta || {}
  }));
  s.edges = (s.edges || []).map(e => ({
    source: e.source ?? e.from ?? e.fromId,
    target: e.target ?? e.to ?? e.toId,
    label: e.label ?? (e.meta && e.meta.protocol) ?? ""
  })).filter(e => e.source && e.target);
  s.modules = s.modules || [];
  s.rationale = s.rationale || "";
  s.ai_feedback = s.ai_feedback || { confidence: "medium" };
  return s;
}

async function run() {
  // Load .env.local file
  require('dotenv').config({ path: '.env.local' });
  
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/buildwise';
  console.log('🔌 Connecting to MongoDB...');
  console.log('   Using:', mongoUrl.split('@')[1] || 'localhost'); // Hide password
  await mongoose.connect(mongoUrl);
  
  console.log('\n📦 STEP 1: Create Test Project');
  const project = new StudentProject({
    title: "Food Delivery App - Test",
    elevator: "Simple food delivery system",
    must_have_features: ["auth", "payments"],
    constraints: ["low budget"],
    team_size: 2,
    members: [{
      name: "Ardra",
      email: "a@x.com",
      skill_tags: [{ name: "React", level: "beginner", score: 20 }],
      availability_hours_per_week: 6
    }],
    status: "draft"
  });
  await project.save();
  console.log('✅ Project created:', project._id.toString());
  
  console.log('\n🎨 STEP 2: Generate Mock Snapshot');
  const raw = getSimpleMockSnapshot();
  console.log('✅ Mock generated with', raw.nodes.length, 'nodes and', raw.edges.length, 'edges');
  
  console.log('\n🔄 STEP 3: Normalize Snapshot');
  const normalized = normalizeSnapshot(raw);
  console.log('✅ Normalized:', normalized.nodes.length, 'nodes,', normalized.edges.length, 'edges');
  
  console.log('\n💾 STEP 4: Save to Database');
  const snapshot = new Snapshot({
    projectId: project._id.toString(),
    ...normalized
  });
  await snapshot.save();
  console.log('✅ Snapshot saved:', snapshot._id.toString(), 'version:', snapshot.version);
  
  console.log('\n🔍 STEP 5: Verify - Fetch from Database');
  const fetched = await Snapshot.findOne({ projectId: project._id.toString() }).sort({ createdAt: -1 }).lean();
  if (fetched) {
    console.log('✅ Snapshot retrieved successfully');
    console.log('   - Nodes:', fetched.nodes.length);
    console.log('   - Edges:', fetched.edges.length);
    console.log('   - Modules:', fetched.modules);
    console.log('   - Confidence:', fetched.ai_feedback.confidence);
  } else {
    console.log('❌ No snapshot found');
  }
  
  console.log('\n🎯 TEST COMPLETE!');
  console.log('Project ID:', project._id.toString());
  console.log('You can now test the API endpoint:');
  console.log(`  curl http://localhost:3001/api/student/project/${project._id}/snapshot?mode=latest`);
  
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

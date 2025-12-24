// scripts/runJobForProject.js
const mongoose = require('mongoose');

// Define schemas inline to avoid import issues
const StudentProjectSchema = new mongoose.Schema({
  title: String,
  elevator: String,
  must_have_features: { type: [String], default: [] },
  constraints: { type: [String], default: [] },
  team_size: { type: Number, default: 1 },
  distribution_mode: String,
  members: { type: Array, default: [] },
  status: { type: String, default: "draft" },
}, { timestamps: true });

const SnapshotSchema = new mongoose.Schema({
  projectId: { type: String, index: true },
  version: Number,
  nodes: Array,
  edges: Array,
  modules: Array,
  rationale: String,
  ai_feedback: Object,
}, { timestamps: true });

const StudentProject = mongoose.models.StudentProject || mongoose.model('StudentProject', StudentProjectSchema);
const Snapshot = mongoose.models.Snapshot || mongoose.model('Snapshot', SnapshotSchema);

// Simple mock generator fallback
function generateSimpleMock(project) {
  return {
    version: Date.now(),
    nodes: [
      { id: "n1", type: "frontend", label: "Frontend", x: 100, y: 100, meta: {} },
      { id: "n2", type: "backend", label: "Backend", x: 300, y: 100, meta: {} },
      { id: "n3", type: "database", label: "Database", x: 500, y: 100, meta: {} }
    ],
    edges: [
      { from: "n1", to: "n2", label: "API" },
      { from: "n2", to: "n3", label: "Query" }
    ],
    modules: ["auth", "api"],
    rationale: "Simple three-tier architecture",
    ai_feedback: { confidence: "medium" }
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

async function run(projectId){
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/buildwise';
  console.log('Connecting to:', mongoUrl);
  await mongoose.connect(mongoUrl);
  
  const proj = await StudentProject.findById(projectId).lean();
  console.log('Project loaded:', !!proj, proj ? proj.title : 'N/A');
  
  if (!proj) {
    throw new Error('Project not found');
  }
  
  // Generate mock snapshot
  const raw = generateSimpleMock(proj);
  console.log('Raw snapshot generated:', raw ? Object.keys(raw) : raw);
  
  const normalized = normalizeSnapshot(raw);
  console.log('Normalized snapshot:', JSON.stringify(normalized, null, 2));
  
  // Save to DB
  const doc = new Snapshot({ projectId, ...normalized });
  await doc.save();
  console.log('✅ Saved snapshot id:', doc._id, 'version:', doc.version);
  
  await mongoose.disconnect();
}

const pid = process.argv[2];
if(!pid) { 
  console.error('❌ Usage: node scripts/runJobForProject.js PROJECT_ID'); 
  process.exit(1); 
}

run(pid).catch(err => { 
  console.error('❌ Error:', err); 
  process.exit(1); 
});

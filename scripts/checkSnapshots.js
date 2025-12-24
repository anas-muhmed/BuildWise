// scripts/checkSnapshots.js
const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema({
  projectId: { type: String, index: true },
  version: Number,
  nodes: Array,
  edges: Array,
  modules: Array,
  rationale: String,
  ai_feedback: Object,
}, { timestamps: true });

const Snapshot = mongoose.models.Snapshot || mongoose.model('Snapshot', SnapshotSchema);

async function main(){
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/buildwise';
  console.log('Connecting to:', mongoUrl);
  await mongoose.connect(mongoUrl);
  const snaps = await Snapshot.find().sort({createdAt:-1}).limit(10).lean();
  console.log('Total snapshots found:', snaps.length);
  console.log(JSON.stringify(snaps, null, 2));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

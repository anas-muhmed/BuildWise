// scripts/mig-modules-add-fields.js
// Migration script to add approval and proposedEdits fields to existing Module documents
// Usage: node scripts/mig-modules-add-fields.js
// IMPORTANT: Backup your database before running this script!

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const MONGODB = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/buildwise";
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB, {});
  console.log("Connected successfully");

  // Import the Module model after connection
  const { ModuleModel } = require('../src/lib/backend/models/Module');

  console.log("Starting migration...");
  const cursor = ModuleModel.find().cursor();
  let count = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    count++;
    let changed = false;

    // Set default status if missing
    if (!doc.status) {
      doc.status = "proposed";
      changed = true;
    }

    // Initialize meta object with createdBy if missing
    if (!doc.meta) {
      doc.meta = {
        createdBy: doc.created_by || null,
        createdAt: doc.createdAt || doc.created_at || new Date()
      };
      changed = true;
    }

    // Initialize proposedEdits array if missing
    if (!Array.isArray(doc.proposedEdits)) {
      doc.proposedEdits = [];
      changed = true;
    }

    // Save if any changes were made
    if (changed) {
      await doc.save();
      updated++;
      if (updated % 10 === 0) {
        console.log(`Progress: ${updated} documents updated...`);
      }
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`Total documents processed: ${count}`);
  console.log(`Documents updated: ${updated}`);
  
  await mongoose.connection.close();
  console.log("Database connection closed");
  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

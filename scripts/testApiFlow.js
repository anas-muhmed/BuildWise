// scripts/testApiFlow.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testFlow() {
  console.log('\n=== TESTING WITHOUT AUTH - Using Mock Generator Directly ===');
  console.log('Note: Auth is required for create endpoint. Testing snapshot generation instead.\n');
  
  // For now, we'll test the snapshot endpoint with a known project ID
  // You can create a project manually via the UI first, or we'll test with a mock ID
  const testProjectId = process.argv[2] || 'test-project-id';
  
  console.log(`Using project ID: ${testProjectId}\n`);
  console.log('=== STEP 1: Seed Snapshot ===');
  const seedRes = await fetch(`${BASE_URL}/api/student/project/${testProjectId}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  const seedData = await seedRes.json();
  console.log('Seed Response:', JSON.stringify(seedData, null, 2));

  console.log('\n=== STEP 2: Poll Snapshot (5 attempts) ===');
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const snapshotRes = await fetch(`${BASE_URL}/api/student/project/${testProjectId}/snapshot?mode=latest`);
    const snapshotData = await snapshotRes.json();
    console.log(`Attempt ${i+1}:`, JSON.stringify(snapshotData, null, 2));
    
    if (snapshotData.ready) {
      console.log('✅ Snapshot ready!');
      console.log('Nodes:', snapshotData.snapshot?.nodes?.length || 0);
      console.log('Edges:', snapshotData.snapshot?.edges?.length || 0);
      return;
    }
  }

  console.log('❌ Snapshot not ready after 5 attempts');
}

testFlow().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

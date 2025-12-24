// scripts/quickTest.js
// Quick test to verify server is running and APIs respond
const http = require('http');

function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode === 200 });
    });
    req.on('error', () => resolve({ status: 0, ok: false, error: 'Connection failed' }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ status: 0, ok: false, error: 'Timeout' });
    });
  });
}

async function main() {
  console.log('🔍 Quick Server Health Check...\n');
  
  const port = process.env.PORT || 3001;
  const result = await testEndpoint(`http://localhost:${port}`);
  
  if (result.ok) {
    console.log(`✅ Server is running on http://localhost:${port}`);
    console.log('\n📋 Next step: Run the full test');
    console.log('   node scripts/testApiFlow.js\n');
  } else {
    console.log('❌ Server is NOT running');
    console.log('\n📋 Next step: Start the dev server');
    console.log('   npm run dev\n');
  }
}

main();

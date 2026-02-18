// generate-secrets.js
// Run this to generate production secrets: node generate-secrets.js

const crypto = require('crypto');

console.log('\n🔐 PRODUCTION SECRETS - KEEP THESE SAFE!\n');
console.log('Copy these to your production .env file:\n');
console.log('─'.repeat(60));

// Generate JWT Secret (256-bit)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET=${jwtSecret}`);

// Generate MongoDB Password (strong)
const mongoPassword = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
console.log(`MONGO_PASSWORD=${mongoPassword}`);

// Generate Setup Secret (for admin promotion)
const setupSecret = crypto.randomBytes(32).toString('hex');
console.log(`SETUP_SECRET=${setupSecret}`);

console.log('─'.repeat(60));
console.log('\n⚠️  IMPORTANT:');
console.log('1. Save these in a password manager');
console.log('2. Never commit to GitHub');
console.log('3. Use these ONLY in production');
console.log('4. Keep your local .env with test secrets\n');

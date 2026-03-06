// Quick test to verify environment variables are loaded
require('dotenv').config({ path: '.env.local' });

console.log('========================================');
console.log('ENV VARIABLE TEST');
console.log('========================================');
console.log('USE_REAL_AI:', process.env.USE_REAL_AI);
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));
console.log('========================================');

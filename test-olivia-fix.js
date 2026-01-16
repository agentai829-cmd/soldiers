// Test script to verify Olivia's configuration
const { TRAINED_AGENTS, isAgentTrained } = require('./lib/openai-agents.ts');

console.log('🔍 Testing Olivia (pitch-bot) Configuration...\n');

// Test 1: Check if agent is configured
const oliviaConfig = TRAINED_AGENTS['pitch-bot'];
console.log('📋 Olivia Configuration:');
console.log('  - Prompt ID:', oliviaConfig?.promptId || 'NOT FOUND');
console.log('  - Version:', oliviaConfig?.promptVersion || 'NOT FOUND');
console.log('  - Name:', oliviaConfig?.name || 'NOT FOUND');
console.log('  - Max Tokens:', oliviaConfig?.maxTokens || 'NOT FOUND');

// Test 2: Check if agent is marked as trained
const isTrained = isAgentTrained('pitch-bot');
console.log('\n🤖 Is Olivia Trained?:', isTrained ? '✅ YES' : '❌ NO');

// Test 3: Check environment variables
console.log('\n🌍 Environment Variables:');
console.log('  - PITCH_BOT_PROMPT_ID:', process.env.PITCH_BOT_PROMPT_ID || 'NOT SET');
console.log('  - PITCH_BOT_PROMPT_VERSION:', process.env.PITCH_BOT_PROMPT_VERSION || 'NOT SET');

// Test 4: Compare Marcus vs Olivia
const marcusConfig = TRAINED_AGENTS['buddy'];
console.log('\n🔄 Comparison (Marcus vs Olivia):');
console.log('Marcus:');
console.log('  - Prompt ID:', marcusConfig?.promptId || 'NOT FOUND');
console.log('  - Trained?:', isAgentTrained('buddy') ? '✅ YES' : '❌ NO');
console.log('Olivia:');
console.log('  - Prompt ID:', oliviaConfig?.promptId || 'NOT FOUND');
console.log('  - Trained?:', isTrained ? '✅ YES' : '❌ NO');

console.log('\n✨ Test Complete!');
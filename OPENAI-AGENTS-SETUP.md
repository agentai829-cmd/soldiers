# OpenAI Trained Agents Setup Guide

This guide explains how to migrate your Sintra Clone from custom prompts to OpenAI's trained agent system.

## 🚀 Quick Start

### 1. Current Status
- ✅ **Marcus (Business Development)** - Already configured with trained agent
- 🔄 **15 other agents** - Using legacy prompt system (can be migrated)

### 2. Environment Setup

Copy the agent configuration template:
```bash
cp .env.agents.example .env.local
```

Add your trained agent prompt IDs to `.env.local`:
```env
# Marcus is already configured
MARCUS_PROMPT_ID=pmpt_6917a79605708193932c1d844061f44d0b376efe8da58cb0
MARCUS_PROMPT_VERSION=40

# Add other agents as you train them
COPYWRITER_PROMPT_ID=your_prompt_id_here
COPYWRITER_PROMPT_VERSION=1
```

### 3. API Usage

The new system automatically detects and uses trained agents:

```javascript
import { runTrainedAgent } from '@/lib/openai-agents'

// This will use trained model if available, fallback to legacy otherwise
const result = await runTrainedAgent('buddy', 'Help me with business strategy', {
  workspaceId: 'workspace123',
  includeKnowledge: true,
  webSearchEnabled: true
})

console.log(result.response)  // AI response
console.log(result.sources)   // Web search results (if available)
console.log(result.usage)     // Token usage stats
```

## 🎯 Training New Agents

### Step 1: Prepare Training Data
For each agent, you need to:
1. Extract the existing prompt from `lib/helpers.ts`
2. Collect conversation examples
3. Define the agent's capabilities and personality

### Step 2: Train with OpenAI
Use OpenAI's training system to create a custom prompt:
```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Train your agent (example)
const prompt = await openai.prompts.create({
  name: "Copywriter Expert - Jasper",
  instructions: "You are Jasper, an expert copywriter...",
  // Add more training configuration
})

console.log(prompt.id)      // Save this as COPYWRITER_PROMPT_ID
console.log(prompt.version) // Save this as COPYWRITER_PROMPT_VERSION
```

### Step 3: Configure in Sintra
1. Add prompt ID to environment variables
2. Update `TRAINED_AGENTS` configuration in `lib/openai-agents.ts`
3. Test the agent using the API or management interface

## 🛠️ Agent Management Interface

Access the agent management interface at:
```
/workspace/[workspaceId]/settings?tab=agents
```

Features:
- ✅ View training status of all agents
- 🔄 Migrate agents from legacy to trained system
- 📊 Monitor usage and performance
- ⚙️ Configure agent parameters

## 🔧 Configuration Options

Each agent supports these configuration options:

```typescript
{
  promptId: string,           // OpenAI trained prompt ID
  promptVersion: string,      // Prompt version
  name: string,              // Agent display name
  description: string,       // Agent description
  maxTokens?: number,        // Response length limit
  temperature?: number,      // Creativity level (0-2)
  includeWebSearch?: boolean // Enable web search
}
```

## 📈 Benefits of Trained Agents

### Enhanced Capabilities
- 🔍 **Web Search Integration** - Real-time information access
- 📊 **Better Context Understanding** - Improved conversation flow
- ⚡ **Faster Response Times** - Optimized inference
- 🎯 **Consistent Personality** - Reliable agent behavior

### Advanced Features
- **Automatic Fallback** - Uses legacy system if trained agent fails
- **Usage Analytics** - Track token usage and costs
- **Source Attribution** - Web search results with citations
- **Conversation Memory** - Better context awareness

### Performance Improvements
- **Reduced Latency** - Faster response generation
- **Better Accuracy** - Trained on specific use cases
- **Cost Optimization** - More efficient token usage
- **Scalability** - Handle more concurrent requests

## 🔒 Security & Best Practices

### Environment Variables
- Store prompt IDs securely in environment variables
- Use different prompts for development/production
- Rotate API keys regularly

### Error Handling
The system includes robust error handling:
- Automatic fallback to legacy system
- Graceful degradation when APIs are unavailable
- Comprehensive logging for debugging

### Rate Limiting
- Implement rate limiting for API calls
- Monitor usage to stay within OpenAI limits
- Cache responses when appropriate

## 📊 Migration Checklist

### Pre-Migration
- [ ] Backup existing system
- [ ] Test trained agent with sample conversations
- [ ] Configure environment variables
- [ ] Set up monitoring and logging

### Migration Process
- [ ] Train agent with OpenAI system
- [ ] Get prompt ID and version
- [ ] Add to environment configuration
- [ ] Test in development environment
- [ ] Migrate to production
- [ ] Monitor performance and user feedback

### Post-Migration
- [ ] Monitor error rates and fallbacks
- [ ] Collect user feedback on response quality
- [ ] Optimize prompt based on performance
- [ ] Update documentation and training

## 🚀 Example Migration: Copywriter Agent

### 1. Extract Current Prompt
From `lib/helpers.ts`:
```typescript
{
  id: 'penn',
  name: 'Jasper',
  description: 'Copywriting',
  prompt: `Jasper – Copywriting Expert...`
}
```

### 2. Train with OpenAI
Create trained prompt with enhanced capabilities

### 3. Configure Environment
```env
COPYWRITER_PROMPT_ID=pmpt_abc123...
COPYWRITER_PROMPT_VERSION=1
```

### 4. Update Configuration
In `lib/openai-agents.ts`:
```typescript
'penn': {
  promptId: process.env.COPYWRITER_PROMPT_ID || '',
  promptVersion: process.env.COPYWRITER_PROMPT_VERSION || '1',
  name: 'Jasper',
  description: 'Copywriting Expert',
  maxTokens: 1500,
  temperature: 0.8,
  includeWebSearch: false,
}
```

### 5. Test and Deploy
- Test in development
- Verify responses match expected quality
- Deploy to production
- Monitor performance

## 🎯 Next Steps

1. **Prioritize Agents** - Start with most-used agents (Marcus is done)
2. **Batch Training** - Train similar agents together
3. **Performance Testing** - Compare trained vs legacy performance
4. **User Feedback** - Collect feedback on response quality
5. **Iterate** - Improve prompts based on usage data

## 📞 Support

For issues with the trained agent system:
1. Check the agent management interface for status
2. Review logs for error messages
3. Test with legacy fallback system
4. Contact support with specific error details

---

The system is designed to be flexible and backwards-compatible, ensuring a smooth transition from legacy prompts to trained agents while maintaining all existing functionality.
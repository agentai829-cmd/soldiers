import OpenAI from 'openai'
import { db } from './db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// OpenAI Trained Agent Configuration
interface AgentConfig {
  promptId: string
  promptVersion: string
  name: string
  description: string
  maxTokens?: number
  temperature?: number
  includeWebSearch?: boolean
}

// Agent configurations for OpenAI trained system
export const TRAINED_AGENTS: Record<string, AgentConfig> = {
  // Business Development Agent (Marcus)
  buddy: {
    promptId:
      process.env.BUDDY_PROMPT_ID ||
      'pmpt_6917a79605708193932c1d844061f44d0b376efe8da58cb0',
    promptVersion: process.env.BUDDY_PROMPT_VERSION || '48',
    name: 'Bob',
    description: 'Business Development Expert',
    maxTokens: 2248,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Growth & Marketing Planner (Leo)
  'growth-bot': {
    promptId:
      process.env.RICKY_PROMPT_ID ||
      'pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342',
    promptVersion: process.env.RICKY_PROMPT_VERSION || '3',
    name: 'Ricky',
    description: 'Growth & Marketing Planner',
    maxTokens: 2048,
    temperature: 0.8,
    includeWebSearch: true,
  },

  // Investor Deck & Startup Planner (Olivia)
  'pitch-bot': {
    promptId:
      process.env.LISA_BOT_PROMPT_ID ||
      'pmpt_691b81c4ce748195adfe199424710f250cd44242c1968a71',
    promptVersion: process.env.LISA_BOT_PROMPT_VERSION || '3',
    name: 'Lisa',
    description: 'Investor Deck & Startup Planner',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Jasper (Copywriting Expert) - Map from 'penn'
  penn: {
    promptId:
      process.env.LOCAL_CELEBRITY_PROMPT_ID ||
      'pmpt_691baa8055388196bde0c5b1063f66d60b747475243186d5',
    promptVersion: process.env.LOCAL_CELEBRITY_PROMPT_VERSION || '1',
    name: 'Sarah',
    description: 'Local Celebrity',
    maxTokens: 1500,
    temperature: 0.8,
    includeWebSearch: true,
  },

  // Zara (Social Media Expert) - Map from 'soshie'
  soshie: {
    promptId:
      process.env.SOCIAL_PROMPT_ID ||
      'pmpt_691baa9ba85c8194a0b67f04a1988f2e0801a2af70fbc71a',
    promptVersion: process.env.SOCIAL_PROMPT_VERSION || '1',
    name: 'Dave',
    description: 'Social Media Expert',
    maxTokens: 1200,
    temperature: 0.9,
    includeWebSearch: true,
  },

  // Ada (Developer & Code Expert) - Map from 'dev-bot'
  'dev-bot': {
    promptId:
      process.env.ADA_PROMPT_ID ||
      'pmpt_691ba6f8f624819785a227657ce2661905f809f68c987d01',
    promptVersion: process.env.ADA_PROMPT_VERSION || '1',
    name: 'Paul',
    description: 'Developer & Code Expert',
    maxTokens: 3000,
    temperature: 0.3,
    includeWebSearch: true,
  },

  // Edison (App & Product Planner) - Map from 'builder-bot'
  'builder-bot': {
    promptId:
      process.env.EDISON_PROMPT_ID ||
      'pmpt_691ba6f8f624819785a227657ce2661905f809f68c987d01',
    promptVersion: process.env.EDISON_PROMPT_VERSION || '4',
    name: 'Carl',
    description: 'Competition Crusher',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Grace (Project Manager) - Map from 'pm-bot'
  'pm-bot': {
    promptId:
      process.env.GRACE_PROMPT_ID ||
      'pmpt_691ba96827548190b23fae89b54a56b40ad758d880fe510b',
    promptVersion: process.env.GRACE_PROMPT_VERSION || '1',
    name: 'Grace',
    description: 'Project Manager',
    maxTokens: 2048,
    temperature: 0.6,
    includeWebSearch: true,
  },

  // Angelia - Map from 'commet'
  commet: {
    promptId:
      process.env.ANGELIA_PROMPT_ID ||
      'pmpt_691baa3ce27881939a1bdebf35a4fed808e80acd47d96bbb',
    promptVersion: process.env.ANGELIA_PROMPT_VERSION || '1',
    name: 'Angelia',
    description: 'Web & Landing Page Designer',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Felix - Map from 'emmie'
  emmie: {
    promptId:
      process.env.FELIX_PROMPT_ID ||
      'pmpt_691baab2e6a88197990756d9b69882ba099ab480d0064655',
    promptVersion: process.env.FELIX_PROMPT_VERSION || '1',
    name: 'Felix',
    description: 'Email Writer',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Iris - Map from 'seomi'
  seomi: {
    promptId:
      process.env.IRIS_PROMPT_ID ||
      'pmpt_691baac6117c8195a8a5720a78e2bcc10e0463b801d1f97d',
    promptVersion: process.env.IRIS_PROMPT_VERSION || '1',
    name: 'Iris',
    description: 'SEO Expert',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Ethan - Map from 'milli'
  milli: {
    promptId:
      process.env.ETHAN_PROMPT_ID ||
      'pmpt_691baad90b1c81908e40b81fb286e3b90a5b3f51f09229e4',
    promptVersion: process.env.ETHAN_PROMPT_VERSION || '1',
    name: 'Ethan',
    description: 'Sales Expert',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Ava - Map from 'vizzy'
  vizzy: {
    promptId:
      process.env.AVA_PROMPT_ID ||
      'pmpt_691baafb26ec8194a5519b46a887cb3d098a39e5770e2c35',
    promptVersion: process.env.AVA_PROMPT_VERSION || '1',
    name: 'Ava',
    description: 'Virtual Assistant',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Theo - Map from 'cassie'
  cassie: {
    promptId:
      process.env.THEO_PROMPT_ID ||
      'pmpt_691bab0842508195b0777afab2e77e86057bd052899bc354',
    promptVersion: process.env.THEO_PROMPT_VERSION || '1',
    name: 'Theo',
    description: 'Customer Support',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Nadia - Map from 'scouty'
  scouty: {
    promptId:
      process.env.NADIA_PROMPT_ID ||
      'pmpt_691bab1675ac8197b6ba091af4cd1c190799c3860c760dcf',
    promptVersion: process.env.NADIA_PROMPT_VERSION || '1',
    name: 'Nadia',
    description: 'Talent Expert',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Orion - Map from 'dexter'
  dexter: {
    promptId:
      process.env.ORION_PROMPT_ID ||
      'pmpt_691bab286d508196b0cb3fc34bf0f56d06317851652c3742',
    promptVersion: process.env.ORION_PROMPT_VERSION || '1',
    name: 'Orion',
    description: 'Data Analyst',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Sienna - Map from 'gigi'
  gigi: {
    promptId:
      process.env.SIENNA_PROMPT_ID ||
      'pmpt_691bab55cb44819490985f7d8fff3d890166aec5be3bb4fb',
    promptVersion: process.env.SIENNA_PROMPT_VERSION || '1',
    name: 'Sienna',
    description: 'Personal Development',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Kai - Map from 'productivity-coach'
  'productivity-coach': {
    promptId:
      process.env.KAI_PROMPT_ID ||
      'pmpt_691bab6befc481958338c9c0f2dc4fcc022743f84e4d58ec',
    promptVersion: process.env.KAI_PROMPT_VERSION || '1',
    name: 'Kai',
    description: 'Productivity Coach',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Athena - Map from 'strategy-adviser'
  'strategy-adviser': {
    promptId:
      process.env.ATHENA_PROMPT_ID!,
    promptVersion: process.env.ATHENA_PROMPT_VERSION!,
    name: 'Emma',
    description: 'Search Engine',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Bob - Buzz Builder
  'buzz-builder': {
    promptId: process.env.BOB_PROMPT_ID || 'pmpt_your_bob_prompt_id_here',
    promptVersion: process.env.BOB_PROMPT_VERSION || '1',
    name: 'Bob',
    description: 'Buzz Builder - Viral Marketing Expert',
    maxTokens: 2048,
    temperature: 0.8,
    includeWebSearch: true,
  },

  // Lisa - Loyalty Expert
  'loyalty-expert': {
    promptId: process.env.LISA_PROMPT_ID || 'pmpt_your_lisa_prompt_id_here',
    promptVersion: process.env.LISA_PROMPT_VERSION || '1',
    name: 'Lisa',
    description: 'Loyalty & Retention Specialist',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Ricky - Reputation Manager
  'reputation-manager': {
    promptId: process.env.RICKY_PROMPT_ID || 'pmpt_your_ricky_prompt_id_here',
    promptVersion: process.env.RICKY_PROMPT_VERSION || '1',
    name: 'Ricky',
    description: 'Reputation Management Expert',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Emma - SEO Expert
  'seo-expert': {
    promptId: process.env.EMMA_PROMPT_ID || 'pmpt_your_emma_prompt_id_here',
    promptVersion: process.env.EMMA_PROMPT_VERSION || '1',
    name: 'Emma',
    description: 'Search Engine Optimization Specialist',
    maxTokens: 2048,
    temperature: 0.7,
    includeWebSearch: true,
  },

  // Sarah - Local Celebrity Builder
  'local-celebrity': {
    promptId: process.env.SARAH_PROMPT_ID || 'pmpt_your_sarah_prompt_id_here',
    promptVersion: process.env.SARAH_PROMPT_VERSION || '1',
    name: 'Sarah',
    description: 'Local Community Presence Expert',
    maxTokens: 2048,
    temperature: 0.8,
    includeWebSearch: true,
  },

  // Add more agents as you train them
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface AgentRunOptions {
  userId?: string
  conversationHistory?: ChatMessage[]
  context?: string
  includeKnowledge?: boolean
  webSearchEnabled?: boolean
  maxTokens?: number
  temperature?: number
}

/**
 * Run OpenAI Trained Agent
 */
export async function runTrainedAgent(
  mappedMessage: {
    role: string
    content: string
  }[],
  knowledgeDocs: {
    title: string
    content: string
  }[],
  knowledgeContext: string,
  agentId: string,
  userPrompt: string,
  options: AgentRunOptions = {}
): Promise<{
  response: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  sources?: Array<{
    url: string
    title: string
    snippet: string
  }>
}> {
  try {
    console.log(`🤖 Running trained agent: ${agentId}`)

    const agentConfig = TRAINED_AGENTS[agentId]

    if (!agentConfig) {
      throw new Error(`Agent configuration not found for: ${agentId}`)
    }

    if (!agentConfig.promptId) {
      console.log(
        `⚠️ No trained prompt for ${agentId}, falling back to legacy system`
      )
      return await runLegacyAgent(agentId, userPrompt, options)
    }

    // Prepare input array with messages in correct OpenAI format
    const inputArray = []

    console.log(`📚 Building conversation context for ${agentId}...`)

    // Add workspace knowledge as FIRST context message (before conversation history)
    if (knowledgeContext && knowledgeContext?.length > 0) {
      inputArray.push({
        type: 'message',
        role: 'assistant',
        content: `📚 **WORKSPACE KNOWLEDGE BASE**

I have access to the following information from your Brain AI knowledge base. This is YOUR workspace-specific information and should be my PRIMARY source when answering related questions:

${knowledgeContext}

🎯 **How I'll use this knowledge:**
- When you ask about topics covered above, I'll answer based on THIS information, not general knowledge
- I'll cite specific sources and details from the knowledge base
- Website content added to Brain AI represents your preferred information sources

You can ask me anything, and if it relates to the knowledge above, I'll use that as my authoritative source.`,
      })
    }

    // Add conversation history as individual messages (maintaining chronological order)
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      // ENHANCED MEMORY: Include ALL messages (up to 50) for perfect memory recall
      const recentMessages = options.conversationHistory.slice(-50) // Last 50 messages for COMPLETE memory
      console.log(
        `📝 Adding ${recentMessages.length} messages from conversation history (ENHANCED MEMORY MODE)`
      )
      console.log(
        `🧠 Helper will remember ALL details including names, preferences, and context from entire conversation`
      )

      mappedMessage.forEach((msg, idx) => {
        inputArray.push({
          type: 'message',
          role: msg.role,
          content: msg.content,
        })
      })

      console.log(
        `✅ Conversation history added: ${recentMessages.length} messages`
      )
    } else {
      console.log(
        `ℹ️ No conversation history found - this is the first message`
      )
    }

    // Add user message with context (the NEW message from user)
    let finalUserPrompt = userPrompt
    if (options.context) {
      finalUserPrompt = `${options.context}\n\n${userPrompt}`
    }

    inputArray.push({
      type: 'message',
      role: 'user',
      content: finalUserPrompt,
    })

    console.log(`✅ Total messages in context: ${inputArray.length}`)
    console.log(
      `📊 Message breakdown: ${inputArray.filter((m) => m.role === 'user').length} user, ${inputArray.filter((m) => m.role === 'assistant').length} assistant`
    )

    // Prepare response configuration
    const responseConfig: any = {
      prompt: {
        id: agentConfig.promptId,
        version: agentConfig.promptVersion,
      },
      input: inputArray,
      text: {
        format: {
          type: 'text',
        },
      },
      reasoning: {},
      max_output_tokens: options.maxTokens || agentConfig.maxTokens || 2048,
      store: true,
    }

    // Add tools configuration for enhanced agents
    if (
      (options.webSearchEnabled ?? agentConfig.includeWebSearch) &&
      agentConfig.includeWebSearch
    ) {
      responseConfig.tools = [
        {
          type: 'web_search',
          filters: null,
          search_context_size: 'medium',
          user_location: {
            type: 'approximate',
            city: null,
            country: null,
            region: null,
            timezone: null,
          },
        },
      ]
      responseConfig.include = ['web_search_call.action.sources']

      // Add code interpreter for Leo, Edison, and other technical agents
      if (
        agentId === 'growth-bot' ||
        agentId === 'dev-bot' ||
        agentId === 'builder-bot'
      ) {
        responseConfig.tools.push({
          type: 'code_interpreter',
          container: {
            type: 'auto',
          },
        })
        responseConfig.include.push('code_interpreter_call.outputs')
      }
    }

    // Note: Temperature is not supported with OpenAI Responses API (trained agents)
    // Temperature control is handled by the trained prompt itself

    console.log('🚀 Calling OpenAI trained agent API...')
    console.log('📝 User prompt:', userPrompt.substring(0, 100) + '...')
    console.log(
      '🔧 Request config:',
      JSON.stringify(
        {
          promptId: responseConfig.prompt.id,
          inputCount: responseConfig.input.length,
          maxTokens: responseConfig.max_output_tokens,
        },
        null,
        2
      )
    )

    // Make API call to OpenAI trained agent
    const response = await openai.responses.create(responseConfig)

    console.log('✅ Trained agent response received')

    // Extract response text from OpenAI Responses API format
    let responseText = ''

    console.log('🔍 Checking response structure...')
    console.log('output_text exists:', 'output_text' in (response as any))
    console.log('output_text value:', (response as any).output_text)
    console.log('output exists:', 'output' in (response as any))
    console.log(
      'output length:',
      Array.isArray((response as any).output)
        ? (response as any).output.length
        : 'not array'
    )

    // Try output_text first (top-level response text)
    if (
      (response as any).output_text &&
      typeof (response as any).output_text === 'string' &&
      (response as any).output_text.length > 0
    ) {
      responseText = (response as any).output_text
      console.log(
        '✅ Extracted from output_text:',
        responseText.substring(0, 50) + '...'
      )
    }
    // Try output array (message format) - THIS IS THE PRIMARY PATH
    else if (
      (response as any).output &&
      Array.isArray((response as any).output) &&
      (response as any).output.length > 0
    ) {
      console.log('🔍 Trying to extract from output array...')

      // Find the first message type item (skip reasoning items)
      const messageItem = (response as any).output.find(
        (item: any) => item.type === 'message'
      )

      if (messageItem && messageItem.content) {
        console.log('✅ Found message item in output array')
        const contentArray = messageItem.content
        if (Array.isArray(contentArray)) {
          responseText = contentArray
            .map((item: any) => {
              console.log(
                'Content item type:',
                item?.type,
                'has text:',
                'text' in item
              )
              return item.text || ''
            })
            .filter((text: string) => text.length > 0)
            .join('\n')
          console.log(
            '✅ Extracted from output message.content:',
            responseText.substring(0, 50) + '...'
          )
        }
      } else {
        console.log('⚠️ No message type found in output array')
        console.log(
          'Output array items:',
          (response as any).output.map((item: any) => ({
            type: item.type,
            id: item.id,
          }))
        )
      }
    }
    // Try text.content format
    else if (
      (response as any).text?.content &&
      typeof (response as any).text.content === 'string'
    ) {
      responseText = (response as any).text.content
      console.log(
        '✅ Extracted from text.content:',
        responseText.substring(0, 50) + '...'
      )
    }
    // Try text field as string
    else if (
      (response as any).text &&
      typeof (response as any).text === 'string'
    ) {
      responseText = (response as any).text
      console.log(
        '✅ Extracted from text (string):',
        responseText.substring(0, 50) + '...'
      )
    }

    if (!responseText) {
      console.error('❌ Could not extract response text')
      console.error('Response keys:', Object.keys(response))
      console.error('Text field type:', typeof (response as any).text)
      console.error('Text field value:', (response as any).text)
      console.error('Output_text value:', (response as any).output_text)
      console.error('Output value:', (response as any).output)
      throw new Error('No response text extracted from OpenAI trained agent')
    }

    // Extract web search sources if available
    let sources: any[] = []
    if (response.output && Array.isArray(response.output)) {
      // Look for web search results in output
      response.output.forEach((item: any) => {
        if (item.content && Array.isArray(item.content)) {
          item.content.forEach((content: any) => {
            if (content.type === 'web_search_result') {
              sources.push(content)
            }
          })
        }
      })
    }

    if (sources.length > 0) {
      console.log('🔍 Web search sources found:', sources.length)
    }

    // Extract usage information
    const usage = {
      promptTokens: response.usage?.input_tokens || 0,
      completionTokens: response.usage?.output_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    }

    console.log('📈 Token usage:', usage)

    return {
      response: responseText,
      usage,
      sources: sources.length > 0 ? sources : undefined,
    }
  } catch (error) {
    console.error('Error running trained agent:', error)

    // Fallback to legacy system if trained agent fails
    console.log('🔄 Falling back to legacy agent system...')
    return await runLegacyAgent(agentId, userPrompt, options)
  }
}

/**
 * Get workspace knowledge for context - Enhanced with vector search
 */
async function getWorkspaceKnowledge(
  workspaceId: string,
  query: string,
  topK: number = 15
): Promise<Array<{ title: string; content: string; source?: string }>> {
  try {
    console.log(`🔍 Searching knowledge base for workspace: ${workspaceId}`)
    console.log(`🔍 Query: ${query.substring(0, 100)}...`)

    // First, try to get relevant documents using vector search
    let docs: Array<{ title: string; content: string; source?: string }> = []

    try {
      // Import the vector search function
      const { retrieveRelevantDocs } = await import('./openai')
      const vectorResults = await retrieveRelevantDocs(workspaceId, query, topK)

      if (vectorResults && vectorResults.length > 0) {
        console.log(
          `✅ Found ${vectorResults.length} documents via vector search`
        )
        docs = vectorResults.map((doc) => ({
          title: doc.title,
          content: doc.content.substring(0, 1500), // Limit content length
          source: undefined, // Vector search results don't have source info
        }))
      }
    } catch (vectorError: unknown) {
      const errorMessage =
        vectorError instanceof Error ? vectorError.message : 'Unknown error'
      console.log(
        '⚠️ Vector search failed, falling back to text search:',
        errorMessage
      )
    }

    // If vector search didn't work or found no results, fall back to text search
    if (docs.length === 0) {
      console.log('🔍 Using fallback text search...')
      const fallbackDocs = await db.knowledgeDoc.findMany({
        where: {
          userId: '',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          title: true,
          content: true,
          sourceUrl: true,
        },
        take: topK,
        orderBy: { createdAt: 'desc' },
      })

      docs = fallbackDocs.map((doc) => ({
        title: doc.title,
        content: doc.content.substring(0, 1500), // Limit content length
        source: doc.sourceUrl || undefined,
      }))

      console.log(`✅ Found ${docs.length} documents via text search`)
    }

    // If still no docs, get recent docs from workspace
    if (docs.length === 0) {
      console.log('🔍 No specific matches, getting recent documents...')
      const recentDocs = await db.knowledgeDoc.findMany({
        where: { userId: '' },
        select: {
          title: true,
          content: true,
          sourceUrl: true,
        },
        take: Math.min(topK, 5), // At most 5 recent docs
        orderBy: { createdAt: 'desc' },
      })

      docs = recentDocs.map((doc) => ({
        title: doc.title,
        content: doc.content.substring(0, 1500),
        source: doc.sourceUrl || undefined,
      }))

      console.log(`✅ Using ${docs.length} recent documents as context`)
    }

    return docs
  } catch (error) {
    console.error('❌ Error fetching workspace knowledge:', error)
    return []
  }
}

/**
 * Fallback to legacy agent system
 */
async function runLegacyAgent(
  agentId: string,
  userPrompt: string,
  options: AgentRunOptions
): Promise<{
  response: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}> {
  try {
    // Import legacy functions
    const { generateWithRAG, generateBusinessResponse } = await import(
      './openai'
    )
    const { getHelperById } = await import('./helpers')

    const helper = getHelperById(agentId)
    if (!helper) {
      throw new Error(`Helper not found: ${agentId}`)
    }

    let response: string

    // Use enhanced business model for Marcus
    if (agentId === 'buddy') {
      response = await generateBusinessResponse(
        userPrompt,
        options.conversationHistory,
        {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 3000,
        }
      )
    } else {
      // Use RAG for other helpers
      if (!options.userId) {
        throw new Error('userId is required for legacy agent fallback')
      }

      response = await generateWithRAG(
        {
          userId: options.userId,
          query: userPrompt,
          brandVoice: undefined,
          helperPrompt: helper.prompt,
          conversationHistory: options.conversationHistory,
        },
        options.context ? `${options.context}\n\n${userPrompt}` : userPrompt,
        {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 2000,
        }
      )
    }

    return {
      response,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  } catch (error) {
    console.error('Legacy agent fallback failed:', error)
    throw error
  }
}

/**
 * Check if agent has trained model available
 */
export function isAgentTrained(agentId: string): boolean {
  const config = TRAINED_AGENTS[agentId]
  return !!(config && config.promptId && config.promptId !== '')
}

/**
 * Get all available trained agents
 */
export function getTrainedAgents(): AgentConfig[] {
  return Object.entries(TRAINED_AGENTS)
    .filter(([_, config]) => config.promptId !== '')
    .map(([id, config]) => ({ ...config, id }))
}

/**
 * Migrate agent to trained system
 */
export async function migrateAgentToTrained(
  agentId: string,
  promptId: string,
  promptVersion: string
): Promise<void> {
  if (TRAINED_AGENTS[agentId]) {
    TRAINED_AGENTS[agentId].promptId = promptId
    TRAINED_AGENTS[agentId].promptVersion = promptVersion

    console.log(`✅ Agent ${agentId} migrated to trained system`)
    console.log(`   Prompt ID: ${promptId}`)
    console.log(`   Version: ${promptVersion}`)
  } else {
    throw new Error(`Agent ${agentId} not found in configuration`)
  }
}

export default {
  runTrainedAgent,
  isAgentTrained,
  getTrainedAgents,
  migrateAgentToTrained,
  TRAINED_AGENTS,
}

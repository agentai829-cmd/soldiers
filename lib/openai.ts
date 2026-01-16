import OpenAI from 'openai'
import { db } from './db'

// Note: All responses use OpenAI's native formatting without custom text processing
// This ensures we get the cleanest, most accurate formatting from OpenAI's models
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Remove markdown formatting characters from text
function removeMarkdown(text: string): string {
  return text.replace(/[*_#>-]/g, '')
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RAGContext {
  userId: string
  query: string
  topK?: number
  brandVoice?: string
  helperPrompt?: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}

export interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

/**
 * Generate embeddings for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    })

    return response.data[0].embedding
  } catch (error) {
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Retrieve relevant documents from the knowledge base using vector similarity
 */
export async function retrieveRelevantDocs(
  userId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; title: string; similarity: number }>> {
  try {
    console.log('='.repeat(80))
    console.log('📚 KNOWLEDGE BASE SEARCH STARTED')
    console.log('👤 User ID:', userId)
    console.log('🔍 Query:', query)
    console.log('📊 Requested docs (topK):', topK)
    console.log('='.repeat(80))

    let results: Array<{ title: string; content: string; similarity: number }> =
      []

    // Try vector search first if we can generate embeddings
    try {
      console.log('🔍 Attempting vector similarity search...')
      const queryEmbedding = await generateEmbedding(query)

      // Import and use vector search
      const { vectorSimilaritySearch } = await import('./pgvector')
      const vectorResults = await vectorSimilaritySearch(
        userId,
        queryEmbedding,
        topK,
        0.5 // similarity threshold
      )

      if (vectorResults && vectorResults.length > 0) {
        console.log(
          `✅ Vector search found ${vectorResults.length} relevant documents`
        )
        results = vectorResults.map((doc) => ({
          title: doc.title,
          content: doc.content,
          similarity: doc.similarity,
        }))

        console.log(`✅ Returning ${results.length} docs from vector search`)
        return results
      } else {
        console.log(
          '⚠️ Vector search returned no results, falling back to text search'
        )
        return []
      }
    } catch (vectorError) {
      console.log(
        '⚠️ Vector search failed, falling back to text search:',
        vectorError
      )
    }

    // Fallback to text-based search if vector search fails or returns no results
    console.log('🔍 Using text-based search...')
    console.log(`🔍 Query: "${query}"`)

    // Extract key words from query for better matching
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
    console.log(`🔍 Key query words: ${queryWords.join(', ')}`)

    const docs = await db.knowledgeDoc.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' as any } },
          { content: { contains: query, mode: 'insensitive' as any } },
          // Also search by individual query words for better recall
          ...queryWords.slice(0, 3).map((word) => ({
            OR: [
              { title: { contains: word, mode: 'insensitive' as any } },
              { content: { contains: word, mode: 'insensitive' as any } },
            ],
          })),
        ],
      },
      select: {
        title: true,
        content: true,
        sourceUrl: true,
        sourceType: true,
      },
      take: topK * 2, // Get more docs initially
      orderBy: { updatedAt: 'desc' },
    })

    console.log(`📄 Text search found ${docs.length} relevant docs`)
    if (docs.length > 0) {
      console.log('📄 Documents found:')
      docs.slice(0, 5).forEach((d, i) => {
        console.log(
          `  ${i + 1}. ${d.title} (${d.sourceType}) - ${d.content.substring(0, 80)}...`
        )
      })
    }

    results = docs.slice(0, topK).map((doc) => ({
      title: doc.title,
      content: doc.content.substring(0, 2000), // Increased content length
      similarity: 0.9,
    }))

    // If we don't have enough relevant docs, get ALL workspace docs
    if (results.length < topK) {
      const remainingCount = topK - results.length
      console.log(
        `⚠️ Only found ${results.length} docs, fetching ${remainingCount} more recent docs...`
      )

      const recentDocs = await db.knowledgeDoc.findMany({
        where: {
          userId,
          NOT: {
            OR:
              docs.length > 0
                ? docs.map((doc) => ({ title: doc.title }))
                : undefined,
          },
        },
        select: {
          title: true,
          content: true,
          sourceUrl: true,
          sourceType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: remainingCount,
      })

      console.log(`📄 Added ${recentDocs.length} recent docs for context`)
      if (recentDocs.length > 0) {
        console.log('📄 Recent documents:')
        recentDocs.forEach((d, i) => {
          console.log(
            `  ${i + 1}. ${d.title} (${d.sourceType}) - ${d.sourceUrl || 'no URL'}`
          )
        })
      }

      const additionalResults = recentDocs.map((doc) => ({
        title: doc.title,
        content: doc.content.substring(0, 1500),
        similarity: 0.7,
      }))

      results = [...results, ...additionalResults]
    }

    console.log(`✅ Returning ${results.length} docs from text search`)
    return results
  } catch (error) {
    console.error('❌ Error retrieving knowledge docs:', error)
    return []
  }
}

/**
 * Generate text with RAG (Retrieval-Augmented Generation)
 */
export async function generateWithRAG(
  context: RAGContext,
  userPrompt: string,
  options: GenerationOptions = {}
): Promise<string> {
  try {
    const relevantDocs = await retrieveRelevantDocs(
      context.userId,
      context.query || userPrompt,
      context.topK || 5
    )

    const contextText = relevantDocs
      .map((doc, index) => `[Doc ${index + 1}] ${doc.title}: ${doc.content}`)
      .join('\n\n')

    let systemPrompt = ''

    if (context.helperPrompt) {
      systemPrompt = context.helperPrompt

      if (contextText) {
        systemPrompt += `\n\n=== 📚 WORKSPACE KNOWLEDGE BASE ===\nThe following information has been added to this workspace's Brain AI and represents the AUTHORITATIVE source for these topics:\n\n${contextText}\n\n=== END KNOWLEDGE BASE ===\n\n🎯 **CRITICAL**: When answering questions:\n1. **CHECK KNOWLEDGE FIRST**: If any knowledge above relates to the user's question, use it as your PRIMARY source\n2. **PRIORITIZE ACCURACY**: Website content and documents in the knowledge base are the user's preferred information sources\n3. **CITE YOUR SOURCES**: Always mention which knowledge document or website your answer comes from\n4. **BE SPECIFIC**: Include exact details, statistics, and quotes from the knowledge base\n5. **DON'T IGNORE IT**: Never provide generic answers when specific knowledge is available above\n\nIf the question is about a topic covered in the knowledge base, answer BASED ON that knowledge, not general information.`
      }

      if (context.brandVoice) {
        systemPrompt += `\n\nBRAND VOICE: ${context.brandVoice}`
      }
    } else {
      systemPrompt = `${context.brandVoice || 'Professional and engaging'}

Please format your response using proper markdown formatting:
- Use **bold text** for headings and important points
- Use ## for main section headings  
- Use **Text:** for subsection labels
- Structure your response clearly with bold headings
- Use bullet points with - for lists
- Add blank lines between sections for readability

${contextText || ''}`
    }

    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }]

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const historyMessages = context.conversationHistory
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))

      messages.push(...historyMessages)
    }

    messages.push({ role: 'user', content: userPrompt })

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages,
      response_format: { type: 'text' },
      temperature: options.temperature || 0.7,
      max_completion_tokens: options.maxTokens || 2000,
      stream: options.stream || false,
    })

    const result = (response as any).choices[0]?.message?.content || ''
    return result // Keep markdown formatting for proper display
  } catch (error) {
    throw new Error('Failed to generate response')
  }
}

/**
 * Generate social media post content
 */
export async function generateSocialPost(
  workspaceId: string,
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter',
  prompt: string,
  brandVoice?: string
): Promise<{
  content: string
  hashtags: string[]
  callToAction?: string
}> {
  try {
    const platformGuidelines = {
      linkedin: {
        maxLength: 3000,
        style: 'Professional, thought-leadership focused',
        features: 'Include industry insights, use professional hashtags',
      },
      facebook: {
        maxLength: 2000,
        style: 'Conversational and engaging',
        features: 'Encourage comments and shares',
      },
      instagram: {
        maxLength: 2200,
        style: 'Visual-first, lifestyle focused',
        features: 'Use trending hashtags, emojis, visual descriptions',
      },
      twitter: {
        maxLength: 280,
        style: 'Concise and impactful',
        features: 'Brief, punchy, thread-worthy',
      },
    }

    const guidelines = platformGuidelines[platform]

    const systemPrompt = `You are a social media content creator. Create a ${platform} post that follows these guidelines:

Platform: ${platform}
Max Length: ${guidelines.maxLength} characters
Style: ${guidelines.style}
Features: ${guidelines.features}

Brand Voice: ${brandVoice || 'Professional and engaging'}

Requirements:
- Stay within character limit
- Include relevant hashtags (return as separate array)
- Include a clear call-to-action when appropriate
- Match the platform's typical content style
- Be engaging and on-brand

Return the response as JSON with the following structure:
{
  "content": "The main post content",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "callToAction": "Optional call-to-action text"
}`

    const response = await generateWithRAG(
      { workspaceId, query: prompt, brandVoice },
      `Create a ${platform} post: ${prompt}`,
      { temperature: 0.8 }
    )

    // Parse JSON response - using OpenAI's native formatting
    try {
      const parsed = JSON.parse(response)
      return {
        content: parsed.content || '',
        hashtags: parsed.hashtags || [],
        callToAction: parsed.callToAction,
      }
    } catch {
      // Fallback if JSON parsing fails - return raw OpenAI response
      return {
        content: response,
        hashtags: [],
      }
    }
  } catch (error) {
    console.error('Error generating social post:', error)
    throw new Error('Failed to generate social media post')
  }
}

/**
 * Generate email response
 */
export async function generateEmailResponse(
  workspaceId: string,
  originalEmail: {
    subject: string
    from: string
    body: string
  },
  responseType: 'reply' | 'forward' = 'reply',
  brandVoice?: string
): Promise<{
  subject: string
  body: string
}> {
  try {
    const systemPrompt = `You are an AI email assistant. Generate professional email responses.

Brand Voice: ${brandVoice || 'Professional, helpful, and courteous'}

Guidelines:
- Be professional and courteous
- Address the sender's concerns directly
- Keep responses concise but thorough
- Use appropriate email formatting
- Match the tone of the original email when appropriate`

    const userPrompt = `Generate a ${responseType} to this email:

From: ${originalEmail.from}
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Please provide a professional response that addresses their message appropriately.`

    const response = await generateWithRAG(
      { workspaceId, query: originalEmail.body, brandVoice },
      userPrompt,
      { temperature: 0.6 }
    )

    // Extract subject and body from response
    const subjectPrefix = responseType === 'reply' ? 'Re: ' : 'Fwd: '
    const subject = originalEmail.subject.startsWith(subjectPrefix)
      ? originalEmail.subject
      : `${subjectPrefix}${originalEmail.subject}`

    // Return OpenAI's native response without custom formatting
    return {
      subject,
      body: response,
    }
  } catch (error) {
    console.error('Error generating email response:', error)
    throw new Error('Failed to generate email response')
  }
}

/**
 * Generate image using OpenAI DALL-E
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
  } = {}
): Promise<string> {
  try {
    console.log('🎨 Generating image with DALL-E...')
    console.log('Prompt:', prompt)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    console.log('✅ Image generated successfully')
    // Return OpenAI's native response without custom formatting
    return imageUrl
  } catch (error) {
    console.error('Error generating image:', error)
    throw new Error('Failed to generate image')
  }
}

/**
 * Analyze uploaded image using OpenAI Vision
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string = "What's in this image?"
): Promise<string> {
  try {
    console.log('👁️ Analyzing image with GPT-4o Vision...')

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'text' },
      max_completion_tokens: 1000,
    })

    // Return OpenAI's native response without custom formatting
    const result = response.choices[0]?.message?.content || ''
    console.log('✅ Image analysis completed')

    return result
  } catch (error) {
    console.error('Error analyzing image:', error)
    throw new Error('Failed to analyze image')
  }
}

/**
 * Analyze uploaded PDF using OpenAI Assistants API
 */
export async function analyzePDF(
  fileId: string,
  prompt: string = 'Analyze and summarize this document.'
): Promise<string> {
  try {
    console.log('📄 Analyzing PDF with OpenAI Assistants API...')
    console.log('File ID:', fileId)

    // Create a temporary assistant for PDF analysis
    const assistant = await openai.beta.assistants.create({
      name: 'PDF Analyzer',
      instructions:
        'You are a helpful assistant that can analyze PDF documents. Provide comprehensive summaries and extract key information from documents.',
      model: 'gpt-5.1',
      tools: [{ type: 'file_search' }],
    })

    // Create a thread
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: prompt,
          attachments: [
            {
              file_id: fileId,
              tools: [{ type: 'file_search' }],
            },
          ],
        },
      ],
    })

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    })

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    while (
      runStatus.status === 'queued' ||
      runStatus.status === 'in_progress'
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    }

    if (runStatus.status === 'completed') {
      // Get the messages
      const messages = await openai.beta.threads.messages.list(thread.id)
      const result = messages.data
        .filter((message) => message.role === 'assistant')
        .map((message) =>
          message.content
            .filter((content) => content.type === 'text')
            .map((content) => content.text.value)
            .join('\n')
        )
        .join('\n')

      // Cleanup
      await openai.beta.assistants.del(assistant.id)

      console.log('✅ PDF analysis completed')
      // Return OpenAI's native response without custom formatting
      return result || 'Unable to analyze the PDF document.'
    } else {
      throw new Error(`Analysis failed with status: ${runStatus.status}`)
    }
  } catch (error) {
    console.error('Error analyzing PDF:', error)
    throw new Error('Failed to analyze PDF')
  }
}

/**
 * Analyze user request and suggest appropriate helper if current helper is not suitable
 */
export async function analyzeHelperSuitability(
  userPrompt: string,
  currentHelperId: string,
  currentHelperName: string,
  currentHelperDescription: string
): Promise<{
  isSuitable: boolean
  suggestedHelper?: {
    id: string
    name: string
    description: string
    suggestedPrompt: string
  }
  explanation?: string
}> {
  try {
    const { getAllHelpers } = await import('@/lib/helpers')
    const allHelpers = getAllHelpers()

    const helpersList = allHelpers.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
    }))

    const analysisPrompt = `You are a helper recommendation system. Analyze if the user's request is suitable for the current helper, and if not, suggest the most appropriate helper.

Current Helper: ${currentHelperName} (${currentHelperDescription})
User Request: "${userPrompt}"

Available Helpers:
${helpersList.map((h) => `- ${h.id} (${h.name}): ${h.description}`).join('\n')}

Analyze the request and respond with a JSON object:
{
  "isSuitable": boolean,
  "explanation": "Brief explanation why current helper is/isn't suitable",
  "suggestedHelper": {
    "id": "use-exact-id-from-list-above",
    "name": "Helper Name", 
    "description": "Helper Description",
    "suggestedPrompt": "Optimized version of user's request for the suggested helper"
  }
}

IMPORTANT: Use the EXACT helper ID from the list above (buddy, penn, scouty, dexter, etc.)

Rules:
1. If current helper is suitable (even if not perfect), set isSuitable to true
2. Only suggest different helper if the request is clearly outside current helper's expertise
3. Make suggestedPrompt more specific and optimized for the suggested helper
4. Be helpful but not overly prescriptive

Examples:
- If user asks buddy (Marcus/Business Development) to "write code for a website", suggest dev-bot (Ada/Developer)
- If user asks dev-bot (Ada/Developer) to "create a marketing strategy", suggest growth-bot (Leo/Growth & Marketing)
- If user asks soshie (Zara/Social Media) to "debug my JavaScript", suggest dev-bot (Ada/Developer)
- If user asks scouty (Nadia/Talent) to "write marketing copy", suggest penn (Jasper/Copywriting)
- If user asks for "general business advice" to any helper, current helper is usually suitable`

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'text' },
      temperature: 0.3,
      max_completion_tokens: 500,
    })

    const result = response.choices[0]?.message?.content || ''

    try {
      let cleanResult = result.trim()
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const analysis = JSON.parse(cleanResult)

      if (!analysis.isSuitable && analysis.suggestedHelper) {
        const correctHelper = allHelpers.find(
          (h) =>
            h.name.toLowerCase() ===
              analysis.suggestedHelper.name.toLowerCase() ||
            h.id === analysis.suggestedHelper.id
        )

        if (correctHelper) {
          analysis.suggestedHelper = {
            id: correctHelper.id,
            name: correctHelper.name,
            description: correctHelper.description,
            suggestedPrompt: analysis.suggestedHelper.suggestedPrompt,
          }
        }
      }

      return {
        isSuitable: analysis.isSuitable,
        suggestedHelper: analysis.suggestedHelper,
        explanation: analysis.explanation,
      }
    } catch (parseError) {
      return { isSuitable: true }
    }
  } catch (error) {
    return { isSuitable: true }
  }
}

/**
 * Generate business response using OpenAI's enhanced business model for Marcus
 */
export async function generateBusinessResponse(
  userPrompt: string,
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>,
  options: GenerationOptions = {}
): Promise<string> {
  try {
    const businessSystemPrompt = `You are Marcus, a business development expert. Provide strategic, actionable business advice.

Please format your response using proper markdown formatting:
- Use **bold text** for headings and important points
- Use ## for main section headings  
- Use **Text:** for subsection labels like **Market Analysis:** and **Strategic Recommendation:**
- Structure your response clearly with bold headings
- Use bullet points with - for lists
- Add blank lines between sections for readability

Format headings exactly like: **Market Analysis:** and **Strategic Recommendation:**`

    const messages: ChatMessage[] = [
      { role: 'system', content: businessSystemPrompt },
    ]

    if (conversationHistory && conversationHistory.length > 0) {
      const historyMessages = conversationHistory
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      messages.push(...historyMessages)
    }

    messages.push({ role: 'user', content: userPrompt })

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages,
      response_format: { type: 'text' },
      temperature: options.temperature || 0.7,
      max_completion_tokens: options.maxTokens || 2048,
    })

    const result = response.choices[0]?.message?.content || ''
    return result // Keep markdown formatting for proper display
  } catch (error) {
    const fallbackMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are Marcus, a business development expert. Provide strategic, actionable business advice.`,
      },
      { role: 'user', content: userPrompt },
    ]

    const fallbackResponse = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: fallbackMessages,
      response_format: { type: 'text' },
      temperature: 0.7,
      max_completion_tokens: 2000,
    })

    return (
      fallbackResponse.choices[0]?.message?.content ||
      'Unable to generate response.'
    )
  }
}

/**
 * Generate response for Leo using specialized growth and marketing prompt
 */
export async function generateWithLeoAPI(
  userInput: string,
  options: GenerationOptions = {}
): Promise<string> {
  try {
    const leoSystemPrompt = `You are Leo, a Growth & Marketing Planner expert. You specialize in planning and automating marketing campaigns, ads, and growth strategies for startups and businesses. Your mission is to generate sustainable growth through data-driven marketing and performance optimization.

Core skills: campaign planning, ad targeting, funnel optimization, audience analysis, and growth experimentation.

Response format: Campaign Objective → Strategy Plan → Execution Steps → Performance Metrics → Optimization Recommendations, ensuring measurable growth outcomes.

Tone: energetic, strategic, and results-oriented, blending analytical insights with creative marketing techniques.

Please format your response using proper markdown formatting:
- Use **bold text** for headings and important points
- Use ## for main section headings  
- Use **Text:** for subsection labels like **Growth Plan:** and **Metrics to Track:**
- Structure your response clearly with bold headings
- Use bullet points with - for lists
- Add blank lines between sections for readability`

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: leoSystemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'text' },
      temperature: options.temperature || 0.8,
      max_completion_tokens: options.maxTokens || 2048,
    })

    const result = response.choices[0]?.message?.content || ''
    return result // Keep markdown formatting for proper display
  } catch (error) {
    console.error('Error with Leo API:', error)
    // Fallback to regular chat completion
    const fallbackResponse = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: userInput }],
      response_format: { type: 'text' },
      temperature: 0.7,
      max_completion_tokens: 2000,
    })

    return (
      fallbackResponse.choices[0]?.message?.content ||
      'Unable to generate response.'
    )
  }
}

export { openai }

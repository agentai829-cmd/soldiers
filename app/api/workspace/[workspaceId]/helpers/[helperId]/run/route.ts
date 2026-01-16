import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  generateWithRAG,
  analyzeHelperSuitability,
  generateWithLeoAPI,
  generateImage,
  retrieveRelevantDocs,
} from '@/lib/openai'
import {
  runTrainedAgent,
  isAgentTrained,
  TRAINED_AGENTS,
} from '@/lib/openai-agents'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { db } from '@/lib/db'
import {
  createNewConversation,
  getExistingConversation,
  saveMessage,
  getConversationMessages,
} from '@/lib/conversation'
import { z } from 'zod'
import OpenAI from 'openai'
import { redis } from '@/lib/redis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const runHelperSchema = z.object({
  prompt: z.string().min(1),
  context: z.string().optional(),
  conversationId: z.string(), // Can be null, undefined, or string
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(4000).optional(),
      stream: z.boolean().optional(),
    })
    .optional(),
  userImageUrl: z.string().nullable(),
  filename: z.string().nullable(),
  id: z.string().nullable(),
  type: z.string().nullable(),
})

// Preserve OpenAI's natural formatting - no custom modifications
function formatResponse(response: string): string {
  return response // Keep original formatting exactly as OpenAI provides it
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; helperId: string }> }
) {
  const resolvedParams = await params
  const body = await request.json()
  const {
    prompt,
    context,
    conversationId,
    options,
    userImageUrl,
    filename,
    type,
    id,
  } = runHelperSchema.parse(body)
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { message: 'User is not authenticated' },
      { status: 401 }
    )
  }

  const getHelperData = (helperId: string) => {
    switch (helperId) {
      case 'soshie':
        return {
          id: 'soshie',
          name: 'Zara',
          description: 'Social Media',
          prompt: `Zara – Social Media

Zara creates viral-worthy content strategies that build engaged communities and amplify brand presence across all social platforms. Her mission is to transform brand messages into shareable content that drives authentic engagement and builds lasting relationships with audiences. Core skills include content creation, community management, influencer collaboration, social media advertising, and trend analysis. Her response format is: Platform Strategy → Content Creation → Engagement Tactics → Hashtag Strategy → Performance Analysis, ensuring maximum reach and impact. Zara's tone is energetic, trendy, and community-focused, blending creativity with strategic thinking.`,
        }
      case 'vizzy':
        return {
          id: 'vizzy',
          name: 'Ava',
          description: 'Virtual Assistant',
          prompt: `Ava – Virtual Assistant

Ava streamlines operations and enhances productivity through comprehensive administrative support and organizational systems. Her mission is to eliminate inefficiencies and create structured workflows that allow clients to focus on high-value activities. Core skills include task management, scheduling optimization, research coordination, communication handling, and process automation. Her response format is: Task Analysis → Priority Organization → Action Plan → Resource Allocation → Follow-up Schedule, ensuring seamless execution and accountability. Ava's tone is professional, proactive, and detail-oriented, combining efficiency with personalized service.`,
        }
      case 'penn':
        return {
          id: 'penn',
          name: 'Jasper',
          description: 'Copywriting',
          prompt: `Jasper – Copywriting

Jasper crafts persuasive copy that converts prospects into customers across all marketing channels. His mission is to create compelling narratives that resonate with target audiences and drive measurable business outcomes. Core skills include sales copywriting, email marketing, conversion optimization, storytelling, and audience psychology. His response format is: Audience Analysis → Message Strategy → Copy Creation → Call-to-Action → Performance Metrics, ensuring maximum conversion potential. Jasper's tone is persuasive, engaging, and results-focused, combining creativity with data-driven insights.`,
        }
      case 'milli':
        return {
          id: 'milli',
          name: 'Ethan',
          description: 'Sales',
          prompt: `Ethan – Sales Agent

Ethan builds high-performing sales systems that consistently convert prospects into loyal customers. His mission is to create predictable revenue growth through strategic sales processes, relationship building, and conversion optimization. Core skills include lead qualification, objection handling, closing techniques, CRM management, and sales automation. His response format is: Lead Analysis → Sales Strategy → Objection Handling → Closing Approach → Follow-up System, ensuring maximum conversion rates and customer satisfaction. Ethan's tone is confident, relationship-focused, and results-driven, combining consultative selling with proven sales methodologies.`,
        }
      case 'seomi':
        return {
          id: 'seomi',
          name: 'Iris',
          description: 'SEO',
          prompt: `Iris – SEO

Iris optimizes websites for search engines to drive organic traffic and improve online visibility. Her mission is to implement comprehensive SEO strategies that increase rankings, traffic, and conversions through data-driven optimization. Core skills include keyword research, on-page optimization, technical SEO, content strategy, and performance analytics. Her response format is: SEO Audit → Keyword Strategy → Content Optimization → Technical Implementation → Performance Tracking, ensuring sustainable organic growth. Iris's tone is analytical, strategic, and results-oriented, combining technical expertise with business understanding.`,
        }
      case 'pitch-bot':
        return {
          id: 'pitch-bot',
          name: 'Olivia',
          description: 'Investor Deck & Startup Planner',
          prompt: `Olivia – Investor Deck & Startup Planner

Olivia focuses on creating compelling investor presentations, startup plans, and financial overviews to help businesses secure funding and support. Her mission is to translate complex business concepts into persuasive, visually engaging presentations that resonate with investors and stakeholders. Core skills include financial modeling, business plan structuring, storytelling for impact, investor psychology, and visual presentation design. Olivia's response format is: Problem Definition → Solution Overview → Market Potential → Financial Highlights → Call to Action, ensuring each output is coherent and persuasive. Her tone is professional, persuasive, and precise, balancing data-driven insights with storytelling flair.`,
        }
      case 'growth-bot':
        return {
          id: 'growth-bot',
          name: 'Leo',
          description: 'Growth & Marketing Planner',
          prompt: `Leo – Growth & Marketing Planner

Leo specializes in planning and automating marketing campaigns, ads, and growth strategies for startups and businesses. His mission is to generate sustainable growth through data-driven marketing and performance optimization. Core skills include campaign planning, ad targeting, funnel optimization, audience analysis, and growth experimentation. His response format is: Campaign Objective → Strategy Plan → Execution Steps → Performance Metrics → Optimization Recommendations, ensuring measurable growth outcomes. Leo's tone is energetic, strategic, and results-oriented, blending analytical insights with creative marketing techniques.`,
        }
      case 'dev-bot':
        return {
          id: 'dev-bot',
          name: 'Ada',
          description: 'Developer & Code Expert',
          prompt: `Ada – Developer & Code Expert

Ada writes, debugs, and explains real code across full-stack development projects. Her mission is to provide reliable, maintainable, and scalable code solutions while assisting teams in understanding and implementing complex software. Core skills include software architecture, full-stack programming, debugging, code optimization, and API integration. Her response format is: Requirement Analysis → Architecture → Code Implementation → Testing → Deployment Guidelines, ensuring efficient and high-quality coding. Ada's tone is logical, technical, and solution-oriented, combining precision with clarity for developers.`,
        }
      case 'pm-bot':
        return {
          id: 'pm-bot',
          name: 'Grace',
          description: 'Project Manager',
          prompt: `Grace – Project Manager

Grace develops talent acquisition strategies, employee engagement programs, and organizational culture initiatives. Her mission is to foster productive workplace environments, attract top talent, and build sustainable human resources systems. Core skills include talent acquisition, performance management, employee development, compensation structuring, and workplace culture building. Her response format is: Talent Assessment → Strategy Development → Implementation Plans → Evaluation Metrics → Culture Integration, ensuring alignment between human resources and business objectives. Grace's tone is people-focused, strategic, and empowering, balancing professionalism with empathy.`,
        }
      case 'buddy':
      default:
        return {
          id: 'buddy',
          name: 'Bob',
          description: 'Business Development',
          prompt:
            "You are Bob, powered by OpenAI's advanced trained agent system. This prompt is a fallback only - your primary responses come from the OpenAI trained agent model. Provide business development expertise with real-time market analysis.",
        }
    }
  }

  const helper = getHelperData(resolvedParams.helperId)
  if (!helper) {
    console.log('❌ Helper not found:', resolvedParams.helperId)
    return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
  }

  const userPrompt = context ? `Context: ${context}\n\nTask: ${prompt}` : prompt

  let enhancedHelperPrompt = helper.prompt

  if (prompt.includes('[ATTACHED IMAGE ANALYSIS]')) {
    enhancedHelperPrompt += `\n\nIMPORTANT: The user has shared an image with you. The image analysis is included in their message. As ${helper.name}, please respond based on both their text request and the visual content described in the image analysis. Be specific about what you see and how it relates to your area of expertise.`
  }

  const agentConfig = TRAINED_AGENTS[helper.id]

  const prevCashedHistory = await redis.get(`user:${userId}:chat-context`)
  let mappedMessages: any = null
  if (!prevCashedHistory) {
    console.log('No previous cached history found, fetching from DB')
    const prevMessages = await db.message.findMany({
      where: { conversationId },
      take: 100,
      orderBy: { messageOrder: 'desc' },
      select: { role: true, content: true },
    })

    mappedMessages = prevMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  } else {
    console.log('Using previous cached history from Redis')
    mappedMessages = JSON.parse(prevCashedHistory)
  }

  // Fast heuristic-based image detection (no AI call needed for obvious cases)
  const imageKeywords = [
    'generate image',
    'create image',
    'make image',
    'draw',
    'picture',
    'photo',
    'artwork',
    'illustration',
    'generate a',
    'create a',
    'make a',
    'design a',
    'sketch',
    'painting',
    'visual',
    'graphic',
    'image of',
    'picture of',
    'drawing of',
    'photo of',
    'art of',
    'logo',
    'icon',
    'poster',
    'generate an image',
    'create an image',
    'make an image',
    'draw an image',
    'show me a',
    'can you draw',
    'can you create',
    'can you generate',
    'can you make',
    'visualize',
  ]

  const promptLower = userPrompt.toLowerCase()
  const hasImageKeywords = imageKeywords.some((keyword) =>
    promptLower.includes(keyword)
  )

  // Additional pattern matching for common image requests
  const imagePatterns = [
    /\b(generate|create|make|draw|design|show me)\s+(a|an)?\s*(image|picture|photo|drawing|artwork|illustration|visual|graphic|logo|icon|poster)/i,
    /\b(draw|sketch|paint|illustrate|visualize)\s/i,
    /\bimage of\b/i,
    /\bpicture of\b/i,
    /\bphoto of\b/i,
  ]

  const hasImagePatterns = imagePatterns.some((pattern) =>
    pattern.test(userPrompt)
  )

  let isImageRequest = false

  if (hasImageKeywords && hasImagePatterns) {
    // Obvious image request - no AI classification needed
    isImageRequest = true
    console.log(
      'Fast detection: Image generation request detected via keywords/patterns'
    )
  } else {
    // Check for ambiguous cases that might need AI classification
    const ambiguousKeywords = [
      'show',
      'display',
      'present',
      'demonstrate',
      'create',
      'make',
      'generate',
    ]
    const hasAmbiguousKeywords = ambiguousKeywords.some((keyword) =>
      promptLower.includes(keyword)
    )

    if (hasAmbiguousKeywords && promptLower.length < 100) {
      // Only use AI classification for short, potentially ambiguous prompts
      console.log('Using AI classification for ambiguous prompt')
      const classificationPrompt = `Is this a request to generate/create/draw an image or visual content? Answer only YES or NO.

      User message: "${userPrompt}"`

      try {
        const response = await openai.responses.create({
          model: 'gpt-4o-mini',
          input: [
            {
              role: 'user',
              type: 'message',
              content: classificationPrompt,
            },
          ],
          temperature: 0.1,
        })

        const answer = response.output_text.trim().toLowerCase()
        isImageRequest = answer.includes('yes')
      } catch (error) {
        console.error('Classification error:', error)
        isImageRequest = false // Default to false on error
      }
    }
    // If no ambiguous keywords, assume it's not an image request (no AI call)
  }
  if (isImageRequest) {
    console.log('User asking for image generation')
    const imageUrl = await generateImage(userPrompt, {
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    })

    // Create assistant message content for image generation
    const assistantContent = `I've generated an image based on your request: "${userPrompt}"\n\n🖼️ **Generated Image:**\n${imageUrl}\n\nThe image has been created with the following specifications:\n- Size: 1024x1024 pixels\n- Quality: Standard\n- Style: Vivid\n\nYou can view and download the image using the link above.`

    const lastMessage = await db.message.findFirst({
      where: { conversationId },
      orderBy: { messageOrder: 'desc' },
      select: { messageOrder: true },
    })

    const messageOrder = lastMessage?.messageOrder || 0

    // Create user message
    await db.message.create({
      data: {
        conversationId,
        role: 'user',
        attachments:
          userImageUrl && filename && type && id
            ? [
                {
                  filename: filename,
                  dataUrl: userImageUrl,
                  type: type,
                  id: id,
                },
              ]
            : undefined,
        content: userPrompt,
        messageOrder: messageOrder + 1,
      },
    })

    // Create assistant message
    await db.message.create({
      data: {
        conversationId,
        role: 'assistant',
        imageUrl: imageUrl,
        content: assistantContent,
        messageOrder: messageOrder + 2,
      },
    })

    // Manage Redis cache with 100 message limit
    const newMessages = [
      ...mappedMessages,
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: assistantContent },
    ]

    // Keep only the last 100 messages
    const limitedMessages =
      newMessages.length > 100 ? newMessages.slice(-100) : newMessages

    await redis.set(
      `user:${userId}:chat-context`,
      JSON.stringify(limitedMessages)
    )

    return NextResponse.json(
      {
        imageUrl,
        response: assistantContent,
        conversationId,
      },
      {
        status: 200,
      }
    )
  }

  let knowledgeContext = ''

  const knowledgeDocs = await retrieveRelevantDocs(
    resolvedParams.workspaceId,
    prompt,
    15
  )

  if (knowledgeDocs && knowledgeDocs.length > 0) {
    console.log(`Found ${knowledgeDocs.length} knowldge docs for`)
    knowledgeContext = knowledgeDocs
      .map((doc) => `**${doc.title}**\n${doc.content}`)
      .join('\n\n')
  }

  const responseConfig: any = {
    prompt: {
      id: agentConfig.promptId,
      version: agentConfig.promptVersion,
    },
    input: [
      {
        type: 'message',
        role: 'user',
        content: `${
          mappedMessages.length > 0
            ? `Previous conversation context:\n${mappedMessages
                .reverse()
                .map(
                  (msg: any, index: any) =>
                    `[${index + 1}] ${msg.role}: ${msg.content}`
                )
                .join('\n')}\n\n`
            : ''
        } ${knowledgeContext.trim().length > 0 ? `Previous data context. Check if user current request is related to the following information only then reply based on this context else just reply current message without considering this context:\n${knowledgeContext}\n\n` : ''} Current user message: ${userPrompt}`,
      },
    ],
    text: {
      format: {
        type: 'text',
      },
    },
    reasoning: {},
    store: true,
  }

  const titleResponseConfig: any = {
    prompt: {
      id: agentConfig.promptId,
      version: agentConfig.promptVersion,
    },
    input: [
      {
        type: 'message',
        role: 'user',
        content: `This is the user prompt: ${userPrompt}\n\nGenerate a short and concise title summarizing the main topic of this conversation for easy reference later. Don't add quotes or punctuation.`,
      },
    ],
    text: {
      format: {
        type: 'text',
      },
    },
    reasoning: {},
    store: true,
  }

  let buddyResponse = ''
  console.log('Helper ID ', helper.id)
  if (helper.id === 'buddy') {
    console.log(
      `🤖 Using OpenAI trained agent for Marcus with enhanced knowledge...`
    )

    const agentResult = await runTrainedAgent(
      mappedMessages,
      knowledgeDocs,
      knowledgeContext,
      helper.id,
      prompt,
      {
        workspaceId: resolvedParams.workspaceId,
        conversationHistory: mappedMessages,
        context,
        includeKnowledge: true,
        webSearchEnabled: true,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      }
    )

    buddyResponse = formatResponse(agentResult.response)
  }

  const titleStream = await openai.responses.stream(titleResponseConfig)

  const encoder = new TextEncoder()
  let responseText = ''
  let titleText = ''

  let responseReadable: any = null
  let buddyResponseReadable: any = null

  if (!buddyResponse) {
    console.log('Not buddy response')
    const stream = await openai.responses.stream(responseConfig)
    responseReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta') {
              responseText += event.delta
              controller.enqueue(encoder.encode(event.delta))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Error in response stream:', error)
          controller.error(error)
        }
      },
    })
  } else {
    console.log('Buddy response')
    console.log(buddyResponse)
    // Buddy Response
    buddyResponseReadable = new ReadableStream({
      start(controller) {
        try {
          const chunks = buddyResponse.split(' ')
          let index = 0

          const interval = setInterval(() => {
            if (index < chunks.length) {
              const chunk = index === 0 ? chunks[index] : ' ' + chunks[index]
              responseText += chunk
              controller.enqueue(new TextEncoder().encode(chunk))
              index++
            } else {
              controller.close()
              clearInterval(interval)
            }
          }, 50)
        } catch (error) {
          console.error('Error in buddy response stream:', error)
          controller.error(error)
        }
      },
    })
  }

  // Create the title readable stream
  const titleReadable = new ReadableStream({
    async start(controller) {
      for await (const event of titleStream) {
        if (event.type === 'response.output_text.delta') {
          titleText += event.delta
          // Prefix title chunks with a special marker
          controller.enqueue(
            encoder.encode(
              `${conversationId}__TITLE_START__${event.delta}__TITLE_END__`
            )
          )
        }
      }
      controller.close()
    },
  })

  async function readAllFromStream(stream: any, controller: any) {
    if (!stream) {
      console.log('Stream is undefined, skipping')
      return
    }

    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          controller.enqueue(value)
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // Simple sequential stream approach using the merge utility
  const sequentialStream = new ReadableStream({
    async start(controller) {
      // Check conversation title in database
      let shouldGenerateTitle = false

      if (conversationId) {
        try {
          const existingConversation = await db.conversation.findUnique({
            where: { id: conversationId },
            select: { title: true },
          })

          // If title equals "New Conversation" or is null/empty, generate new title
          shouldGenerateTitle =
            !existingConversation?.title ||
            existingConversation.title === 'New Conversation'
        } catch (error) {
          console.error('Error checking conversation title:', error)
          // Default to generating title on error
          shouldGenerateTitle = true
        }
      } else {
        // No conversationId means new conversation, generate title
        shouldGenerateTitle = true
      }

      try {
        // Process title stream first (only if we should generate title)
        if (shouldGenerateTitle && titleStream) {
          console.log('Processing title stream')
          await readAllFromStream(titleReadable, controller)
        }

        // Then process response stream (always run)
        console.log(
          'Processing response stream, buddyResponse:',
          !!buddyResponse
        )

        if (buddyResponse && buddyResponseReadable) {
          await readAllFromStream(buddyResponseReadable, controller)
        } else if (responseReadable) {
          await readAllFromStream(responseReadable, controller)
        } else {
          console.error('No response stream available')
          controller.error(new Error('No response stream available'))
          return
        }

        // Store conversation in DB (can be done after streams complete)
        const lastMessage = await db.message.findFirst({
          where: { conversationId },
          orderBy: { messageOrder: 'desc' },
          select: { messageOrder: true },
        })

        const messageOrder = lastMessage?.messageOrder || 0

        // Create user message
        await db.message.create({
          data: {
            conversationId,
            role: 'user',
            attachments:
              filename && type && id
                ? [
                    {
                      filename: filename,
                      dataUrl: userImageUrl,
                      type: type,
                      id: id,
                    },
                  ]
                : undefined,
            content: userPrompt,
            messageOrder: messageOrder + 1,
          },
        })

        // Create assistant message
        await db.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: responseText,
            messageOrder: messageOrder + 2,
          },
        })

        // Only update title if we generated one
        if (shouldGenerateTitle && titleText.trim()) {
          await db.conversation.update({
            where: { id: conversationId },
            data: { title: titleText.trim() },
          })
        }

        // Manage Redis cache with 100 message limit
        const newMessages = [
          ...mappedMessages,
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: responseText },
        ]

        // Keep only the last 100 messages
        const limitedMessages =
          newMessages.length > 100 ? newMessages.slice(-100) : newMessages

        await redis.set(
          `user:${userId}:chat-context`,
          JSON.stringify(limitedMessages)
        )

        controller.close()
      } catch (error) {
        console.error('Error in sequential stream:', error)
        controller.error(error)
      }
    },
  })

  // Option 1: Use sequential stream (title first, then content)
  return new Response(sequentialStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ workspaceId: string; helperId: string }> }
// ) {
//   // const body = await request.json()
//   // console.log('📝 Request body:', body)

//   // const { prompt, context, conversationId, options } = runHelperSchema.parse(body)
//   // console.log("Prompt ",prompt)
//   // console.log("Context ", context)
//   // console.log("conversationId ", conversationId)
//   // console.log("options ", options)
//   // return NextResponse.json({message:"Ok"}, {status:200})
//   try {
//     console.log('🚀 Helper run API called')

//     const { userId } = await auth()
//     const resolvedParams = await params

//     console.log('👤 User ID:', userId)
//     console.log('🏢 Workspace ID:', resolvedParams.workspaceId)
//     console.log('🤖 Helper ID:', resolvedParams.helperId)

//     if (!userId) {
//       console.log('❌ Unauthorized - no user ID')
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     // Check if client wants streaming
//     const wantsStream = request.headers
//       .get('accept')
//       ?.includes('text/stream-json')

//     // Check workspace access
//     const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId)
//     if (!hasAccess) {
//       console.log('❌ Forbidden - no workspace access')
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
//     }

//     const body = await request.json()
//     console.log('📝 Request body:', body)

//     const { prompt, context, conversationId, options } =
//       runHelperSchema.parse(body)

//     // Get helper details from hardcoded config
//     console.log('🔍 Looking for helper:', resolvedParams.helperId)

//     // Hardcoded helper data - same as frontend
//     const getHelperData = (helperId: string) => {
//       switch (helperId) {
//         case 'soshie':
//           return {
//             id: 'soshie',
//             name: 'Zara',
//             description: 'Social Media',
//             prompt: `Zara – Social Media

// Zara creates viral-worthy content strategies that build engaged communities and amplify brand presence across all social platforms. Her mission is to transform brand messages into shareable content that drives authentic engagement and builds lasting relationships with audiences. Core skills include content creation, community management, influencer collaboration, social media advertising, and trend analysis. Her response format is: Platform Strategy → Content Creation → Engagement Tactics → Hashtag Strategy → Performance Analysis, ensuring maximum reach and impact. Zara's tone is energetic, trendy, and community-focused, blending creativity with strategic thinking.`,
//           }
//         case 'vizzy':
//           return {
//             id: 'vizzy',
//             name: 'Ava',
//             description: 'Virtual Assistant',
//             prompt: `Ava – Virtual Assistant

// Ava streamlines operations and enhances productivity through comprehensive administrative support and organizational systems. Her mission is to eliminate inefficiencies and create structured workflows that allow clients to focus on high-value activities. Core skills include task management, scheduling optimization, research coordination, communication handling, and process automation. Her response format is: Task Analysis → Priority Organization → Action Plan → Resource Allocation → Follow-up Schedule, ensuring seamless execution and accountability. Ava's tone is professional, proactive, and detail-oriented, combining efficiency with personalized service.`,
//           }
//         case 'penn':
//           return {
//             id: 'penn',
//             name: 'Jasper',
//             description: 'Copywriting',
//             prompt: `Jasper – Copywriting

// Jasper crafts persuasive copy that converts prospects into customers across all marketing channels. His mission is to create compelling narratives that resonate with target audiences and drive measurable business outcomes. Core skills include sales copywriting, email marketing, conversion optimization, storytelling, and audience psychology. His response format is: Audience Analysis → Message Strategy → Copy Creation → Call-to-Action → Performance Metrics, ensuring maximum conversion potential. Jasper's tone is persuasive, engaging, and results-focused, combining creativity with data-driven insights.`,
//           }
//         case 'milli':
//           return {
//             id: 'milli',
//             name: 'Ethan',
//             description: 'Sales',
//             prompt: `Ethan – Sales Agent

// Ethan builds high-performing sales systems that consistently convert prospects into loyal customers. His mission is to create predictable revenue growth through strategic sales processes, relationship building, and conversion optimization. Core skills include lead qualification, objection handling, closing techniques, CRM management, and sales automation. His response format is: Lead Analysis → Sales Strategy → Objection Handling → Closing Approach → Follow-up System, ensuring maximum conversion rates and customer satisfaction. Ethan's tone is confident, relationship-focused, and results-driven, combining consultative selling with proven sales methodologies.`,
//           }
//         case 'seomi':
//           return {
//             id: 'seomi',
//             name: 'Iris',
//             description: 'SEO',
//             prompt: `Iris – SEO

// Iris optimizes websites for search engines to drive organic traffic and improve online visibility. Her mission is to implement comprehensive SEO strategies that increase rankings, traffic, and conversions through data-driven optimization. Core skills include keyword research, on-page optimization, technical SEO, content strategy, and performance analytics. Her response format is: SEO Audit → Keyword Strategy → Content Optimization → Technical Implementation → Performance Tracking, ensuring sustainable organic growth. Iris's tone is analytical, strategic, and results-oriented, combining technical expertise with business understanding.`,
//           }
//         case 'pitch-bot':
//           return {
//             id: 'pitch-bot',
//             name: 'Olivia',
//             description: 'Investor Deck & Startup Planner',
//             prompt: `Olivia – Investor Deck & Startup Planner

// Olivia focuses on creating compelling investor presentations, startup plans, and financial overviews to help businesses secure funding and support. Her mission is to translate complex business concepts into persuasive, visually engaging presentations that resonate with investors and stakeholders. Core skills include financial modeling, business plan structuring, storytelling for impact, investor psychology, and visual presentation design. Olivia's response format is: Problem Definition → Solution Overview → Market Potential → Financial Highlights → Call to Action, ensuring each output is coherent and persuasive. Her tone is professional, persuasive, and precise, balancing data-driven insights with storytelling flair.`,
//           }
//         case 'growth-bot':
//           return {
//             id: 'growth-bot',
//             name: 'Leo',
//             description: 'Growth & Marketing Planner',
//             prompt: `Leo – Growth & Marketing Planner

// Leo specializes in planning and automating marketing campaigns, ads, and growth strategies for startups and businesses. His mission is to generate sustainable growth through data-driven marketing and performance optimization. Core skills include campaign planning, ad targeting, funnel optimization, audience analysis, and growth experimentation. His response format is: Campaign Objective → Strategy Plan → Execution Steps → Performance Metrics → Optimization Recommendations, ensuring measurable growth outcomes. Leo's tone is energetic, strategic, and results-oriented, blending analytical insights with creative marketing techniques.`,
//           }
//         case 'dev-bot':
//           return {
//             id: 'dev-bot',
//             name: 'Ada',
//             description: 'Developer & Code Expert',
//             prompt: `Ada – Developer & Code Expert

// Ada writes, debugs, and explains real code across full-stack development projects. Her mission is to provide reliable, maintainable, and scalable code solutions while assisting teams in understanding and implementing complex software. Core skills include software architecture, full-stack programming, debugging, code optimization, and API integration. Her response format is: Requirement Analysis → Architecture → Code Implementation → Testing → Deployment Guidelines, ensuring efficient and high-quality coding. Ada's tone is logical, technical, and solution-oriented, combining precision with clarity for developers.`,
//           }
//         case 'pm-bot':
//           return {
//             id: 'pm-bot',
//             name: 'Grace',
//             description: 'Project Manager',
//             prompt: `Grace – Project Manager

// Grace develops talent acquisition strategies, employee engagement programs, and organizational culture initiatives. Her mission is to foster productive workplace environments, attract top talent, and build sustainable human resources systems. Core skills include talent acquisition, performance management, employee development, compensation structuring, and workplace culture building. Her response format is: Talent Assessment → Strategy Development → Implementation Plans → Evaluation Metrics → Culture Integration, ensuring alignment between human resources and business objectives. Grace's tone is people-focused, strategic, and empowering, balancing professionalism with empathy.`,
//           }
//         case 'buddy':
//         default:
//           return {
//             id: 'buddy',
//             name: 'Bob',
//             description: 'Business Development',
//             prompt:
//               "You are Bob, powered by OpenAI's advanced trained agent system. This prompt is a fallback only - your primary responses come from the OpenAI trained agent model. Provide business development expertise with real-time market analysis.",
//           }
//       }
//     }

//     const helper = getHelperData(resolvedParams.helperId)

//     if (!helper) {
//       console.log('❌ Helper not found:', resolvedParams.helperId)
//       return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
//     }

//     console.log('✅ Helper found:', helper.name)

//     // Get workspace details for brand voice
//     const workspace = await db.workspace.findUnique({
//       where: { id: resolvedParams.workspaceId },
//       select: {
//         id: true,
//         name: true,
//         brandVoice: true,
//       },
//     })

//     console.log('🏢 Workspace found:', workspace?.name)

//     // Handle conversation logic
//     let currentConversationId: string

//     console.log('🔍 Conversation ID from request:', conversationId)
//     console.log('🔍 Conversation ID type:', typeof conversationId)
//     console.log('🔍 Conversation ID is null:', conversationId === null)
//     console.log(
//       '🔍 Conversation ID is undefined:',
//       conversationId === undefined
//     )

//     if (conversationId) {
//       // Check if existing conversation belongs to user
//       console.log(
//         '🔄 Attempting to load existing conversation:',
//         conversationId
//       )
//       const existingConv = await getExistingConversation(conversationId, userId)
//       if (existingConv) {
//         currentConversationId = conversationId
//         console.log('✅ Using existing conversation:', currentConversationId)
//       } else {
//         // Invalid conversation ID, create new one
//         console.log(
//           "⚠️ Conversation not found or doesn't belong to user, creating new conversation"
//         )
//         currentConversationId = await createNewConversation(
//           resolvedParams.workspaceId,
//           resolvedParams.helperId,
//           userId
//         )
//         console.log('🆕 Created new conversation:', currentConversationId)
//       }
//     } else {
//       // No conversation ID provided, create new one
//       console.log('🆕 No conversation ID provided, creating new conversation')
//       currentConversationId = await createNewConversation(
//         resolvedParams.workspaceId,
//         resolvedParams.helperId,
//         userId
//       )
//       console.log('🆕 Created new conversation:', currentConversationId)
//     }

//     console.log('💬 Final Conversation ID being used:', currentConversationId)

//     // Get conversation history for context - ENHANCED MEMORY: All messages for perfect recall
//     const conversationHistory = await getConversationMessages(
//       currentConversationId,
//       16000
//     ) // Doubled for better memory
//     console.log(
//       '📚 Conversation history length:',
//       conversationHistory.length,
//       'messages'
//     )
//     console.log(
//       '📚 Conversation history tokens: ~',
//       Math.ceil(
//         conversationHistory.reduce(
//           (sum, msg) => sum + msg.content.length / 4,
//           0
//         )
//       ),
//       'tokens'
//     )

//     // DEBUG: Log conversation history details
//     if (conversationHistory.length > 0) {
//       console.log('🔍 Conversation history details:')
//       console.log(
//         '🧠 MEMORY MODE: Enhanced - Helper will remember ALL previous messages including names, preferences, and context'
//       )
//       conversationHistory.forEach((msg, idx) => {
//         console.log(
//           `  [${idx + 1}] ${msg.role}: ${msg.content.substring(0, 80)}...`
//         )
//       })
//     } else {
//       console.log(
//         'ℹ️ No conversation history found - this is the first message in conversation:',
//         currentConversationId
//       )
//     }

//     // Construct the prompts properly
//     const userPrompt = context
//       ? `Context: ${context}\n\nTask: ${prompt}`
//       : prompt

//     console.log('💭 Helper prompt:', helper.prompt)
//     console.log('👤 User prompt:', userPrompt)

//     // Check if current helper is suitable for the request
//     console.log('🔍 Analyzing helper suitability...')
//     const suitabilityAnalysis = await analyzeHelperSuitability(
//       prompt,
//       helper.id,
//       helper.name,
//       helper.description
//     )

//     // Conservative redirect logic - only redirect for very specific cases
//     const shouldRedirect =
//       !suitabilityAnalysis.isSuitable &&
//       suitabilityAnalysis.suggestedHelper &&
//       helper.id !== 'buddy' && // Marcus can handle broader topics
//       suitabilityAnalysis.explanation && // Must have clear explanation
//       suitabilityAnalysis.explanation
//         .toLowerCase()
//         .includes('completely outside') // Only for very clear mismatches

//     console.log('🤔 Redirect decision:', {
//       isSuitable: suitabilityAnalysis.isSuitable,
//       shouldRedirect,
//       explanation: suitabilityAnalysis.explanation,
//     })

//     // If current helper is not suitable, suggest the appropriate helper
//     if (shouldRedirect && suitabilityAnalysis.suggestedHelper) {
//       const suggestedHelper = suitabilityAnalysis.suggestedHelper

//       console.log(`💡 Suggesting different helper: ${suggestedHelper.name}`)

//       const redirectResponse = `Hi! I'm ${helper.name}, and I specialize in ${helper.description.toLowerCase()}.

// ${suitabilityAnalysis.explanation}

// For your request: "${prompt}"

// I'd recommend using **${suggestedHelper.name}** instead, as they specialize in ${suggestedHelper.description.toLowerCase()}.

// 🎯 **Here's the optimized prompt for ${suggestedHelper.name}:**
// "${suggestedHelper.suggestedPrompt}"

// **How to get the best results:**
// 1. Navigate to ${suggestedHelper.name} helper (${suggestedHelper.description})
// 2. Use the suggested prompt above
// 3. They'll be much better equipped to help you with this specific request!

// Hope this helps! 😊`

//       // Save the redirect message
//       await saveMessage(currentConversationId, 'user', prompt)
//       await saveMessage(currentConversationId, 'assistant', redirectResponse)

//       return NextResponse.json({
//         response: redirectResponse,
//         conversationId: currentConversationId,
//         helper: {
//           id: helper.id,
//           name: helper.name,
//           description: helper.description,
//         },
//         helperSuggestion: {
//           suggested: true,
//           recommendedHelper: suggestedHelper,
//           explanation: suitabilityAnalysis.explanation,
//         },
//         usage: {
//           promptTokens: 0,
//           completionTokens: 0,
//           totalTokens: 0,
//         },
//       })
//     }

//     // Enhanced system prompt for image understanding and PDF analysis
//     let enhancedHelperPrompt = helper.prompt
//     if (prompt.includes('[ATTACHED IMAGE ANALYSIS]')) {
//       enhancedHelperPrompt += `\n\nIMPORTANT: The user has shared an image with you. The image analysis is included in their message. As ${helper.name}, please respond based on both their text request and the visual content described in the image analysis. Be specific about what you see and how it relates to your area of expertise.`
//     }

//     // Check if message contains PDF file references for automatic analysis
//     let enhancedUserPrompt = userPrompt
//     const pdfFileIdMatch = prompt.match(/\[PDF_FILE_ID:([a-zA-Z0-9-_]+)\]/g)
//     if (pdfFileIdMatch) {
//       console.log('📄 PDF file references found in message:', pdfFileIdMatch)

//       try {
//         const { analyzePDF } = await import('@/lib/openai')

//         // Analyze each PDF file referenced
//         for (const match of pdfFileIdMatch) {
//           const fileId = match.replace(/\[PDF_FILE_ID:([a-zA-Z0-9-_]+)\]/, '$1')
//           console.log('📄 Analyzing PDF with file ID:', fileId)

//           const pdfAnalysis = await analyzePDF(
//             fileId,
//             `Please analyze this PDF document and provide a comprehensive summary of its contents, including key topics, important information, and any relevant details that would help in understanding the document.`
//           )

//           // Replace the file ID reference with actual analysis
//           enhancedUserPrompt = enhancedUserPrompt.replace(
//             match,
//             `[PDF DOCUMENT ANALYSIS: ${pdfAnalysis}]`
//           )
//         }

//         enhancedHelperPrompt += `\n\nIMPORTANT: The user has shared PDF document(s) with you. The document analysis is included in their message. As ${helper.name}, please respond based on both their text request and the document content. Reference specific information from the document and provide insights relevant to your expertise.`
//       } catch (error) {
//         console.error('Error analyzing PDF:', error)
//         enhancedUserPrompt = enhancedUserPrompt.replace(
//           /\[PDF_FILE_ID:[a-zA-Z0-9-_]+\]/g,
//           '[PDF analysis failed - unable to process document]'
//         )
//       }
//     }

//     // Generate response using trained agent or enhanced RAG system
//     let response: string
//     let sources: any[] | undefined
//     let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

//     // DEBUG: Log which path each helper takes
//     console.log(`🎯 Processing helper: ${helper.name} (${helper.id})`)
//     console.log(`🎯 Is trained agent: ${isAgentTrained(helper.id)}`)
//     console.log(`🎯 Workspace ID: ${resolvedParams.workspaceId}`)

//     // ALL HELPERS NOW USE KNOWLEDGE BASE - Enhanced system
//     // For Marcus and other trained agents, use trained system with knowledge
//     if (helper.id === 'buddy') {
//       const agentResult = await runTrainedAgent(helper.id, enhancedUserPrompt, {
//         workspaceId: resolvedParams.workspaceId,
//         conversationHistory,
//         context,
//         includeKnowledge: true,
//         webSearchEnabled: true,
//         temperature: options?.temperature,
//         maxTokens: options?.maxTokens,
//       })

//       console.log('enhancedUserPrompt ', enhancedUserPrompt)
//       console.log('context ', context)
//       console.log('response ', agentResult.response)

//       response = agentResult.response
//       sources = agentResult.sources
//       usage = agentResult.usage
//     } else if (isAgentTrained(helper.id)) {
//       // Other trained agents with knowledge base
//       console.log(
//         `🤖 Using trained agent for ${helper.name} with enhanced knowledge...`
//       )

//       const agentResult = await runTrainedAgent(helper.id, enhancedUserPrompt, {
//         workspaceId: resolvedParams.workspaceId,
//         conversationHistory,
//         context,
//         includeKnowledge: true,
//         webSearchEnabled: true,
//         temperature: options?.temperature,
//         maxTokens: options?.maxTokens,
//       })

//       response = agentResult.response
//       sources = agentResult.sources
//       usage = agentResult.usage
//     } else {
//       // Enhanced RAG system for ALL non-trained helpers - GUARANTEED knowledge access
//       console.log(
//         `🧠 Using ENHANCED RAG with guaranteed knowledge access for ${helper.name}...`
//       )

//       // Force knowledge retrieval for ALL helpers - increased to 15 docs for better context
//       const { retrieveRelevantDocs } = await import('@/lib/openai')
//       const knowledgeDocs = await retrieveRelevantDocs(
//         resolvedParams.workspaceId,
//         prompt,
//         15
//       )

//       let knowledgeContext = ''
//       if (knowledgeDocs && knowledgeDocs.length > 0) {
//         console.log(
//           `✅ Retrieved ${knowledgeDocs.length} knowledge documents for ${helper.name}`
//         )
//         knowledgeContext = knowledgeDocs
//           .map((doc) => `**${doc.title}**\n${doc.content}`)
//           .join('\n\n')
//       } else {
//         console.log(
//           `⚠️ No knowledge documents found for ${helper.name} - checking workspace...`
//         )
//         // Fallback: get ANY documents from workspace
//         const fallbackDocs = await db.knowledgeDoc.findMany({
//           where: { workspaceId: resolvedParams.workspaceId },
//           select: { title: true, content: true },
//           take: 5,
//           orderBy: { createdAt: 'desc' },
//         })
//         if (fallbackDocs.length > 0) {
//           console.log(
//             `✅ Using ${fallbackDocs.length} recent documents as fallback context for ${helper.name}`
//           )
//           knowledgeContext = fallbackDocs
//             .map((doc) => `**${doc.title}**\n${doc.content.substring(0, 1000)}`)
//             .join('\n\n')
//         } else {
//           console.log(
//             `❌ No documents found in workspace ${resolvedParams.workspaceId} for ${helper.name}`
//           )
//         }
//       }

//       // Enhanced system prompt with knowledge integration and memory retention
//       const enhancedSystemPrompt = knowledgeContext
//         ? `${helper.prompt}\n\n**🧠 CONVERSATION MEMORY (CRITICAL):**\nYou MUST remember EVERYTHING from our conversation:\n- User's name (if they told you)\n- User's preferences and details\n- All previous topics discussed\n- Any personal information shared\n\nWhen the user asks about something they mentioned before (like their name), ALWAYS recall it from our conversation history. Never say "I don't know" if they told you earlier.\n\n**📚 KNOWLEDGE BASE (YOUR PRIMARY INFORMATION SOURCE):**\nThe workspace owner has provided the following information that you MUST use when answering questions:\n\n${knowledgeContext}\n\n**🎯 CRITICAL INSTRUCTIONS FOR USING KNOWLEDGE:**\n1. **ANSWER FROM KNOWLEDGE FIRST**: If the user's question relates to ANY content in the knowledge base above, you MUST answer based on that content\n2. **BE SPECIFIC**: Reference exact facts, URLs, and details from the knowledge base\n3. **CITE SOURCES**: Mention which document or website your answer comes from (e.g., "According to [website name]...")\n4. **STAY ACCURATE**: Don't make up information - if it's in the knowledge base, use it; if not, say so\n5. **WEBSITE CONTENT**: When knowledge comes from a website URL, treat it as the authoritative source for that topic\n\n**Example Response Format:**\nBased on the information from [source name/website], [answer based on knowledge base content]. [Add specific details and quotes from the knowledge].\n\n🧠 MEMORY: ALWAYS remember names, preferences from conversation history\n📚 KNOWLEDGE: Prioritize knowledge base content over general knowledge`
//         : `${helper.prompt}\n\n**🧠 CONVERSATION MEMORY (CRITICAL):**\nYou MUST remember EVERYTHING from our conversation:\n- User's name (if they told you)\n- User's preferences and details\n- All previous topics discussed\n- Any personal information shared\n\nWhen the user asks about something they mentioned before (like their name), ALWAYS recall it from our conversation history. Never say "I don't know" if they told you earlier.\n\n**⚠️ Note:** No specific knowledge base documents were found for this query. You can provide general assistance, but inform the user that they can add relevant information to the Brain AI knowledge base for more accurate, personalized responses.`

//       console.log(
//         `📝 Enhanced prompt length for ${helper.name}: ${enhancedSystemPrompt.length} characters`
//       )
//       console.log(
//         `📊 Knowledge context length: ${knowledgeContext.length} characters`
//       )

//       response = await generateWithRAG(
//         {
//           workspaceId: resolvedParams.workspaceId,
//           query: prompt,
//           brandVoice: workspace?.brandVoice || undefined,
//           helperPrompt: enhancedSystemPrompt, // Use enhanced prompt with knowledge
//           conversationHistory,
//           topK: 15, // Increased knowledge docs for better context and memory
//         },
//         enhancedUserPrompt,
//         {
//           temperature: options?.temperature || 0.7,
//           maxTokens: options?.maxTokens || 3000,
//           stream: options?.stream || false,
//         }
//       )

//       console.log(
//         `✅ Enhanced RAG response generated for ${helper.name} with knowledge integration`
//       )
//     }

//     console.log('✅ Response generated:', response.substring(0, 100) + '...')

//     // Save user message and AI response to conversation
//     await saveMessage(currentConversationId, 'user', prompt)
//     await saveMessage(currentConversationId, 'assistant', response)

//     console.log('💾 Messages saved to conversation')

//     // Format the response with simple cleanup
//     const formattedResponse = formatResponse(response)

//     // Return proper streaming response or regular JSON based on request
//     if (wantsStream) {
//       // Return streaming response with conversationId in first chunk
//       return new Response(
//         new ReadableStream({
//           start(controller) {
//             const chunks = formattedResponse.split(' ')
//             let index = 0
//             let sentConversationId = false

//             const interval = setInterval(() => {
//               if (index === 0 && !sentConversationId) {
//                 // Send conversationId as first message
//                 controller.enqueue(
//                   new TextEncoder().encode(
//                     `data: ${JSON.stringify({
//                       conversationId: currentConversationId,
//                     })}\n\n`
//                   )
//                 )
//                 sentConversationId = true
//               } else if (index < chunks.length) {
//                 const chunk = index === 0 ? chunks[index] : ' ' + chunks[index]
//                 controller.enqueue(
//                   new TextEncoder().encode(
//                     `data: ${JSON.stringify({ content: chunk })}\n\n`
//                   )
//                 )
//                 index++
//               } else {
//                 controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
//                 controller.close()
//                 clearInterval(interval)
//               }
//             }, 50) // 50ms between words for natural flow
//           },
//         }),
//         {
//           headers: {
//             'Content-Type': 'text/stream-event',
//             'Cache-Control': 'no-cache',
//             Connection: 'keep-alive',
//           },
//         }
//       )
//     }

//     return NextResponse.json({
//       response: formattedResponse,
//       conversationId: currentConversationId, // Return conversation ID for frontend
//       helper: {
//         id: helper.id,
//         name: helper.name,
//         description: helper.description,
//       },
//       usage,
//       sources, // Include web search sources if available
//       metadata: {
//         isTrainedAgent: isAgentTrained(helper.id),
//         hasWebSearch: !!sources && sources.length > 0,
//       },
//     })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid request data', details: error.errors },
//         { status: 400 }
//       )
//     }

//     console.error('Error running helper:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

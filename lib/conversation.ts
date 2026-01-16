import { db } from '@/lib/db'
import { openai } from '@/lib/openai'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  messageOrder: number
}

export interface ConversationSummary {
  id: string
  title: string | null
  helperId: string
  updatedAt: Date
  messageCount: number
}

// Always create a new conversation
export async function createNewConversation(
  helperId: string,
  userId: string
): Promise<string> {
  const conversation = await db.conversation.create({
    data: {
      helperId,
      userId,
    },
  })

  return conversation.id
}

// Get existing conversation by ID
export async function getExistingConversation(
  conversationId: string,
  userId: string
): Promise<{ id: string; helperId: string } | null> {
  const conversation = await db.conversation.findUnique({
    where: {
      id: conversationId,
      userId: userId, // Ensure user owns this conversation
    },
    select: {
      id: true,
      helperId: true,
    },
  })

  return conversation
}

// Save message to conversation
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): Promise<void> {
  // Get next message order
  const lastMessage = await db.message.findFirst({
    where: { conversationId },
    orderBy: { messageOrder: 'desc' },
    select: { messageOrder: true },
  })

  const messageOrder = (lastMessage?.messageOrder || 0) + 1

  // Save message
  await db.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata,
      messageOrder,
    },
  })

  // Update conversation timestamp
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  // Auto-generate title if this is the second message (first AI response)
  if (messageOrder === 2) {
    await generateConversationTitle(conversationId)
  }
}

// Get conversation messages with token limit
export async function getConversationMessages(
  conversationId: string,
  maxTokens: number = 4000
): Promise<ConversationMessage[]> {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { messageOrder: 'desc' },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      imageUrl: true,
      attachments: true,
      messageOrder: true,
    },
  })

  // Filter messages within token limit
  let totalTokens = 0
  const validMessages: ConversationMessage[] = []

  for (const message of messages) {
    const messageTokens = estimateTokens(message.content)
    if (totalTokens + messageTokens > maxTokens) break

    totalTokens += messageTokens
    validMessages.unshift(message as ConversationMessage)
  }

  return validMessages
}

// Get recent conversations for user
export async function getRecentConversations(
  userId: string,
  limit: number = 20
): Promise<ConversationSummary[]> {
  const conversations = await db.conversation.findMany({
    where: {
      userId,
      archived: false,
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      helperId: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
  })

  return conversations.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    helperId: conv.helperId,
    updatedAt: conv.updatedAt,
    messageCount: conv._count.messages,
  }))
}

// Generate conversation title using AI
async function generateConversationTitle(
  conversationId: string
): Promise<void> {
  try {
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { messageOrder: 'asc' },
      take: 4, // First few messages
      select: { role: true, content: true },
    })

    if (messages.length < 2) return

    const conversationText = messages
      .map((m: any) => `${m.role}: ${m.content.slice(0, 200)}`)
      .join('\n')

    const titlePrompt = `Generate a short, descriptive title (max 40 characters) for this conversation:

${conversationText}

Title should be concise and capture the main topic. Don't use quotes.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: titlePrompt }],
      response_format: { type: 'text' },
      max_tokens: 20,
      temperature: 0.7,
    })

    const title = response.choices[0].message.content?.trim() || null

    if (title) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { title },
      })
    }
  } catch (error) {
    console.error('Failed to generate conversation title:', error)
  }
}

// Archive conversation
export async function archiveConversation(
  conversationId: string
): Promise<void> {
  await db.conversation.update({
    where: { id: conversationId },
    data: { archived: true },
  })
}

// Delete conversation
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await db.conversation.delete({
    where: { id: conversationId },
  })
}

// Estimate tokens (rough calculation)
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

// Clear old conversations (cleanup function)
export async function cleanupOldConversations(
  workspaceId: string,
  daysOld: number = 90
): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  await db.conversation.deleteMany({
    where: {
      archived: true,
      updatedAt: {
        lt: cutoffDate,
      },
    },
  })
}

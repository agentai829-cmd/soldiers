import { db } from '@/lib/db'

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  metadata?: any
  isRead: boolean
  createdAt: Date
  helperId?: string
  relatedId?: string
}

export interface InboxData {
  gettingStarted: NotificationData[]
  todos: NotificationData[]
  ideas: NotificationData[]
  unreadCount: number
}

// For now, let's create a temporary service that generates notifications
// until we run the Prisma migration
export async function getUserNotifications(userId: string): Promise<InboxData> {
  try {
    // Get knowledge-based suggestions
    const knowledgeSuggestions = await generateKnowledgeBasedSuggestions(userId)

    // Check if user has any knowledge documents to determine if they're still "new"
    const hasKnowledge =
      (await db.knowledgeDoc.count({ where: { userId } })) > 0

    // Static welcome message - mark as read if user has added knowledge
    const welcomeNotifications = [
      {
        id: 'welcome-1',
        type: 'WELCOME',
        title: 'Welcome to Sintra! 👋',
        message: 'Get started with your AI workspace',
        isRead: hasKnowledge, // Mark as read if user has added knowledge
        createdAt: new Date(),
        helperId: 'vizzy',
        metadata: {},
      },
    ]

    // Calculate unread count based on recent suggestions (last 3 days)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentTodos = knowledgeSuggestions.todos.filter(
      (todo) => new Date(todo.createdAt) > threeDaysAgo
    )
    const recentIdeas = knowledgeSuggestions.ideas.filter(
      (idea) => new Date(idea.createdAt) > threeDaysAgo
    )
    const unreadWelcome = welcomeNotifications.filter((n) => !n.isRead)

    return {
      gettingStarted: welcomeNotifications,
      todos: knowledgeSuggestions.todos,
      ideas: knowledgeSuggestions.ideas,
      unreadCount:
        recentTodos.length + recentIdeas.length + unreadWelcome.length,
    }
  } catch (error) {
    console.error('Error getting notifications:', error)
    return {
      gettingStarted: [],
      todos: [],
      ideas: [],
      unreadCount: 0,
    }
  }
}

export async function generateKnowledgeBasedSuggestions(userId: string) {
  try {
    // Get recent knowledge documents grouped by source URL
    const recentKnowledge = await db.knowledgeDoc.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Get more to group properly
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourceType: true,
        content: true,
        createdAt: true,
      },
    })

    type KnowledgeDoc = (typeof recentKnowledge)[0]

    const todos: NotificationData[] = []
    const ideas: NotificationData[] = []

    // Group documents by source URL to avoid duplicate suggestions
    const websiteGroups = new Map<string, KnowledgeDoc[]>()
    const individualDocs: KnowledgeDoc[] = []

    for (const doc of recentKnowledge) {
      if (doc.sourceUrl && doc.sourceType === 'URL') {
        const domain = extractDomain(doc.sourceUrl)
        // Check if this is an individual image or the main website
        const isImage = doc.sourceUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
        const isLeadConnectorImage = doc.sourceUrl.includes(
          'leadconnectorhq.com'
        )

        if (isImage || isLeadConnectorImage) {
          // Group images by domain - use domain as key for better grouping
          const groupKey = domain
          if (!websiteGroups.has(groupKey)) {
            websiteGroups.set(groupKey, [])
          }
          websiteGroups.get(groupKey)!.push(doc)
        } else {
          // This is a main website document - use domain as key for consistency
          const groupKey = domain
          if (!websiteGroups.has(groupKey)) {
            websiteGroups.set(groupKey, [])
          }
          websiteGroups.get(groupKey)!.push(doc)
        }
      } else {
        individualDocs.push(doc)
      }
    }

    // Generate suggestions for each website group (not individual images)
    for (const [domain, docs] of Array.from(websiteGroups.entries())) {
      if (docs.length === 0) continue

      // Use the most recent document as representative
      const representativeDoc = docs[0]
      const allContent = docs.map((d: KnowledgeDoc) => d.content).join(' ')

      // Count images in this group
      const imageCount = docs.filter(
        (d: KnowledgeDoc) =>
          d.sourceUrl?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ||
          d.sourceUrl?.includes('leadconnectorhq.com')
      ).length
      const mainDoc = docs.find(
        (d: KnowledgeDoc) =>
          !d.sourceUrl?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) &&
          !d.sourceUrl?.includes('leadconnectorhq.com')
      )

      const baseTitle = mainDoc?.title || domain || 'Website'
      const websiteMessage =
        imageCount > 0
          ? `Website with ${imageCount} images analyzed from ${domain}`
          : `Website content analyzed from ${domain}`

      // Get the main website URL for metadata
      const websiteUrl = mainDoc?.sourceUrl || `https://${domain}`

      // Generate contextual suggestions based on combined content
      if (
        domain.includes('linkedin') ||
        allContent.toLowerCase().includes('linkedin')
      ) {
        ideas.push({
          id: `website-${domain}-linkedin`,
          type: 'KNOWLEDGE_SUGGESTION',
          title: 'LinkedIn content opportunity detected',
          message: `I can help create LinkedIn posts based on: ${baseTitle}`,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'soshie',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            suggestedAction: 'create_linkedin_post',
            domain,
            documentCount: docs.length,
            imageCount,
          },
        })
      }

      if (
        domain.includes('github') ||
        allContent.toLowerCase().includes('code') ||
        allContent.toLowerCase().includes('programming')
      ) {
        ideas.push({
          id: `website-${domain}-code`,
          type: 'KNOWLEDGE_SUGGESTION',
          title: 'Code documentation analysis available',
          message: `I can help explain and work with: ${baseTitle}`,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'commet',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            suggestedAction: 'explain_code',
            domain,
            documentCount: docs.length,
            imageCount,
          },
        })
      }

      if (
        allContent.toLowerCase().includes('marketing') ||
        allContent.toLowerCase().includes('strategy') ||
        allContent.toLowerCase().includes('business')
      ) {
        ideas.push({
          id: `website-${domain}-marketing`,
          type: 'KNOWLEDGE_SUGGESTION',
          title: 'Business strategy insights detected',
          message: `I can analyze the strategy from: ${baseTitle}`,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'buddy',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            suggestedAction: 'analyze_strategy',
            domain,
            documentCount: docs.length,
            imageCount,
          },
        })
      }

      if (
        allContent.toLowerCase().includes('email') ||
        allContent.toLowerCase().includes('newsletter') ||
        allContent.toLowerCase().includes('campaign')
      ) {
        ideas.push({
          id: `website-${domain}-email`,
          type: 'KNOWLEDGE_SUGGESTION',
          title: 'Email content opportunity found',
          message: `I can create email campaigns based on: ${baseTitle}`,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'emmie',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            suggestedAction: 'create_email_campaign',
            domain,
            documentCount: docs.length,
            imageCount,
          },
        })
      }

      if (
        allContent.toLowerCase().includes('seo') ||
        allContent.toLowerCase().includes('search') ||
        allContent.toLowerCase().includes('optimization')
      ) {
        ideas.push({
          id: `website-${domain}-seo`,
          type: 'KNOWLEDGE_SUGGESTION',
          title: 'SEO optimization opportunity',
          message: `I can help optimize content from: ${baseTitle}`,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'seomi',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            suggestedAction: 'seo_optimization',
            domain,
            documentCount: docs.length,
            imageCount,
          },
        })
      }

      // Generate one review todo per website (not per document)
      if (docs.some((d: KnowledgeDoc) => d.content.length > 1000)) {
        const totalContentLength = docs.reduce(
          (sum: number, d: KnowledgeDoc) => sum + d.content.length,
          0
        )
        todos.push({
          id: `website-${domain}-review`,
          type: 'TODO_ITEM',
          title: `Review website insights: ${baseTitle}`,
          message: websiteMessage,
          isRead: false,
          createdAt: representativeDoc.createdAt,
          helperId: 'vizzy',
          relatedId: representativeDoc.id,
          metadata: {
            websiteUrl: websiteUrl,
            action: 'review_content',
            contentLength: totalContentLength,
            documentCount: docs.length,
            imageCount,
          },
        })
      }
    }

    // Handle individual documents (non-URL sources)
    for (const doc of individualDocs) {
      if (doc.content.length > 1000) {
        todos.push({
          id: `knowledge-${doc.id}-review`,
          type: 'TODO_ITEM',
          title: `Review document insights`,
          message: `New content added: ${doc.title} (${Math.round(doc.content.length / 100) / 10}k chars)`,
          isRead: false,
          createdAt: doc.createdAt,
          helperId: 'vizzy',
          relatedId: doc.id,
          metadata: {
            knowledgeDocId: doc.id,
            action: 'review_content',
            contentLength: doc.content.length,
          },
        })
      }
    }

    // Add brain-based suggestion only if we have substantial content
    const totalDocs = websiteGroups.size + individualDocs.length
    if (totalDocs > 0) {
      ideas.push({
        id: 'brain-analysis-summary',
        type: 'BRAIN_INSIGHT',
        title: 'Brain AI Analysis Ready',
        message: `I can provide insights from your ${totalDocs} knowledge sources`,
        isRead: false,
        createdAt: new Date(),
        helperId: 'dexter',
        metadata: {
          action: 'analyze_knowledge_base',
          knowledgeCount: totalDocs,
        },
      })
    }

    return { todos, ideas }
  } catch (error) {
    console.error('Error generating knowledge suggestions:', error)
    return { todos: [], ideas: [] }
  }
}

function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export async function createNotification(
  workspaceId: string,
  type: string,
  title: string,
  message: string,
  metadata?: any,
  userId?: string,
  helperId?: string,
  relatedId?: string
) {
  // For now, we'll just log the notification
  // Once Prisma is migrated, we can save to database
  console.log('Creating notification:', {
    workspaceId,
    type,
    title,
    message,
    metadata,
    userId,
    helperId,
    relatedId,
  })
}

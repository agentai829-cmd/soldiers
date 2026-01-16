import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAIDescription(title: string, content: string, url: string | null): Promise<string> {
  try {
    const prompt = `Based on the following website/content information, generate a concise, informative AI description (1-2 sentences) that explains what this content is about and its key value proposition:

Title: ${title}
${url ? `URL: ${url}` : ''}
Content Preview: ${content.substring(0, 500)}...

Generate a professional description that would help users understand what this knowledge item contains:`

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that creates concise, informative descriptions of web content and knowledge items. Keep descriptions under 50 words and focus on the key value and purpose.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'text' },
      max_tokens: 100,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content?.trim() || 'AI-generated description not available'
  } catch (error) {
    console.error('Error generating AI description:', error)
    return 'AI-generated description not available'
  }
}

export async function enhanceKnowledgeWithAI(knowledgeItem: {
  title: string
  content: string
  sourceUrl: string | null
  metadata: any
}) {
  try {
    // Generate AI description if not already present
    const aiDescription = await generateAIDescription(
      knowledgeItem.title,
      knowledgeItem.content,
      knowledgeItem.sourceUrl
    )

    // Enhance metadata with AI description
    const enhancedMetadata = {
      ...knowledgeItem.metadata,
      aiDescription,
      processedAt: new Date().toISOString(),
      aiGenerated: true
    }

    return {
      ...knowledgeItem,
      metadata: enhancedMetadata
    }
  } catch (error) {
    console.error('Error enhancing knowledge with AI:', error)
    return knowledgeItem
  }
}
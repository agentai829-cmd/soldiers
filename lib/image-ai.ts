import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateImageDescription(imageUrl: string, altText?: string): Promise<string> {
  try {
    const prompt = `Analyze this image and provide a brief, descriptive caption in 1-2 sentences. Focus on what's visible in the image, the main subject, and any relevant context.
    
    ${altText ? `Alt text provided: "${altText}"` : ''}
    
    Please provide a clear, concise description suitable for a knowledge base.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      response_format: { type: 'text' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low' // Use low detail for cost efficiency
              }
            }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content?.trim() || 'Image description not available'
  } catch (error) {
    console.error('Error generating image description:', error)
    
    // Fallback to alt text or generic description
    if (altText && altText.trim()) {
      return altText.trim()
    }
    
    return 'Image from website'
  }
}

export async function generateBatchImageDescriptions(images: Array<{src: string; alt: string}>): Promise<Array<{src: string; alt: string; aiDescription: string}>> {
  const results = []
  
  // Process images in batches to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (image) => {
      const aiDescription = await generateImageDescription(image.src, image.alt)
      return {
        ...image,
        aiDescription
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Small delay between batches to be respectful of API limits
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}
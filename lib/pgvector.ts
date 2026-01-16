import { db } from './db'

/**
 * Chunk text into smaller pieces for embedding
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Array<{ content: string; index: number }> {
  const chunks: Array<{ content: string; index: number }> = []
  let startIndex = 0
  let chunkIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunk = text.slice(startIndex, endIndex)

    // Try to break at word boundaries
    if (endIndex < text.length) {
      const lastSpaceIndex = chunk.lastIndexOf(' ')
      if (lastSpaceIndex > chunk.length * 0.8) {
        const adjustedChunk = chunk.slice(0, lastSpaceIndex)
        chunks.push({ content: adjustedChunk, index: chunkIndex })
        startIndex += lastSpaceIndex - overlap
      } else {
        chunks.push({ content: chunk, index: chunkIndex })
        startIndex += chunkSize - overlap
      }
    } else {
      chunks.push({ content: chunk, index: chunkIndex })
      break
    }

    chunkIndex++
  }

  return chunks
}

/**
 * Store embeddings in the database using pgvector
 */
export async function storeEmbedding(
  knowledgeDocId: string,
  content: string,
  vector: number[],
  metadata?: any
): Promise<void> {
  try {
    console.log(`💾 Storing embedding for knowledge doc: ${knowledgeDocId}`)

    // Use raw SQL to insert embedding with vector data
    await db.$executeRaw`
      INSERT INTO embeddings (id, "knowledgeDocId", content, vector, metadata, "createdAt")
      VALUES (
        ${generateId()}, 
        ${knowledgeDocId}, 
        ${content}, 
        ${JSON.stringify(vector)}::vector, 
        ${JSON.stringify(metadata || {})}, 
        NOW()
      )
    `
    console.log('✅ Embedding stored successfully')
  } catch (error) {
    console.error('❌ Error storing embedding:', error)
    throw new Error('Failed to store embedding')
  }
}

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Perform vector similarity search
 */
export async function vectorSimilaritySearch(
  userId: string,
  queryVector: number[],
  limit: number = 10,
  threshold: number = 0.3 // Lowered from 0.5 for better recall
): Promise<
  Array<{
    id: string
    content: string
    title: string
    similarity: number
    metadata?: any
  }>
> {
  try {
    console.log(`📊 Similarity threshold: ${threshold}`)
    console.log(`� User ID: ${userId}`)

    // Raw SQL query using pgvector operators
    const vectorLiteral = `[${queryVector.join(',')}]`

    const results: any = await db.$queryRaw`
 SELECT 
  e.id,
  e.content,
  e.metadata,
  kd.title,
  kd."sourceUrl",
  (1 - (e.vector <=> ${vectorLiteral}::vector) / 2) AS similarity
FROM embeddings e
JOIN knowledge_docs kd ON e."knowledgeDocId" = kd.id
WHERE kd."userId" = ${userId}
ORDER BY e.vector <=> ${vectorLiteral}::vector
LIMIT ${limit}
`

    console.log(`✅ Vector search returned ${results.length} results`)
    if (results.length > 0) {
      console.log('📄 Top results:')
      results.slice(0, 3).forEach((r: any, i: any) => {
        console.log(
          `  ${i + 1}. ${r.title} (similarity: ${r.similarity.toFixed(3)})`
        )
      })
    }
    return results
  } catch (error) {
    console.error('❌ Error performing vector similarity search:', error)
    return []
  }
}

/**
 * Delete all embeddings for a knowledge document
 */
export async function deleteEmbeddings(knowledgeDocId: string): Promise<void> {
  try {
    await db.embedding.deleteMany({
      where: { knowledgeDocId },
    })
  } catch (error) {
    console.error('Error deleting embeddings:', error)
    throw new Error('Failed to delete embeddings')
  }
}

/**
 * Get embedding statistics for a workspace
 */
export async function getEmbeddingStats(userId: string): Promise<{
  totalEmbeddings: number
  totalDocuments: number
  totalTokens: number
}> {
  try {
    const stats = await db.knowledgeDoc.findMany({
      where: { userId },
      include: {
        _count: {
          select: { embeddings: true },
        },
      },
    })

    const totalDocuments = stats.length
    const totalEmbeddings = stats.reduce(
      (acc: number, doc: any) => acc + doc._count.embeddings,
      0
    )

    // Estimate tokens (rough approximation: 1 embedding ≈ 750 tokens)
    const totalTokens = totalEmbeddings * 750

    return {
      totalEmbeddings,
      totalDocuments,
      totalTokens,
    }
  } catch (error) {
    console.error('Error getting embedding stats:', error)
    return {
      totalEmbeddings: 0,
      totalDocuments: 0,
      totalTokens: 0,
    }
  }
}

/**
 * Initialize pgvector extension (for migrations)
 */
export async function initializePgVector(): Promise<void> {
  try {
    await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
    console.log('pgvector extension initialized')
  } catch (error) {
    console.error('Error initializing pgvector:', error)
    throw new Error('Failed to initialize pgvector extension')
  }
}

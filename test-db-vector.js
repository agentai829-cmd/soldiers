/**
 * Simple database connectivity test for vector extension
 * Run with: node test-db-vector.js
 */

const { db } = require('./lib/db')
const { initializePgVector } = require('./lib/pgvector')

async function testDatabaseVector() {
  console.log('🔍 Testing database and vector extension...\n')
  
  try {
    // Test 1: Basic database connection
    console.log('📊 Test 1: Testing database connection...')
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('   Result:', result)
    
    // Test 2: Vector extension
    console.log('\n🧮 Test 2: Testing vector extension...')
    try {
      await initializePgVector()
      console.log('✅ Vector extension initialized successfully!')
      
      // Test vector operations
      const vectorTest = await db.$queryRaw`SELECT '[1,2,3]'::vector as test_vector`
      console.log('✅ Vector operations working!')
      console.log('   Test vector:', vectorTest)
    } catch (vectorError) {
      console.log('❌ Vector extension test failed:', vectorError.message)
    }
    
    // Test 3: Check existing embeddings
    console.log('\n📚 Test 3: Checking existing embeddings...')
    const embeddingCount = await db.embedding.count()
    console.log(`📄 Found ${embeddingCount} existing embeddings in database`)
    
    // Test 4: Check knowledge documents
    console.log('\n📖 Test 4: Checking knowledge documents...')
    const knowledgeCount = await db.knowledgeDoc.count()
    console.log(`📄 Found ${knowledgeCount} knowledge documents in database`)
    
    if (knowledgeCount > 0) {
      const recentDocs = await db.knowledgeDoc.findMany({
        select: { id: true, title: true, workspaceId: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      
      console.log('📋 Recent documents:')
      recentDocs.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.title} (${doc.workspaceId})`)
      })
    }
    
    console.log('\n🎉 Database vector test completed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Only run if called directly
if (require.main === module) {
  testDatabaseVector()
}

module.exports = { testDatabaseVector }
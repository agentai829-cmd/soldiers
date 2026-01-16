/**
 * Test script to verify knowledge base integration with helpers
 * Run with: node test-knowledge-integration.js
 */

async function testKnowledgeIntegration() {
  console.log('🧪 Testing Knowledge Base Integration...\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const workspaceId = process.env.TEST_WORKSPACE_ID || 'test-workspace'
  
  console.log('Base URL:', baseUrl)
  console.log('Workspace ID:', workspaceId)
  console.log()
  
  try {
    // Test 1: Upload knowledge to brain
    console.log('📚 Test 1: Uploading test knowledge to brain...')
    
    const knowledgeResponse = await fetch(`${baseUrl}/api/workspace/${workspaceId}/brain/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'text',
        title: 'Test Company Information',
        content: `Our company, TechCorp, specializes in AI-powered software solutions. 
        We have been in business for 5 years and serve over 1000 customers globally. 
        Our main products include chatbot platforms, automation tools, and AI analytics. 
        Our headquarters is located in San Francisco, California. 
        We have a remote-first culture with employees in 15 countries.`
      })
    })
    
    if (knowledgeResponse.ok) {
      const knowledgeData = await knowledgeResponse.json()
      console.log('✅ Knowledge uploaded successfully!')
      console.log(`   - Chunks created: ${knowledgeData.chunks}`)
      console.log(`   - Embeddings created: ${knowledgeData.embeddingsCreated}`)
      console.log(`   - Message: ${knowledgeData.message}`)
    } else {
      console.log('❌ Failed to upload knowledge:', knowledgeResponse.statusText)
      return
    }
    
    console.log()
    
    // Test 2: Test helper accessing knowledge base
    console.log('🤖 Test 2: Testing helper knowledge base access...')
    
    const testHelpers = ['marcus', 'emmie', 'angelia']
    
    for (const helperId of testHelpers) {
      console.log(`\n🔍 Testing ${helperId}...`)
      
      const helperResponse = await fetch(`${baseUrl}/api/workspace/${workspaceId}/helpers/${helperId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "What company information do you have access to? Tell me about the company in our knowledge base."
        })
      })
      
      if (helperResponse.ok) {
        const helperData = await helperResponse.json()
        
        if (helperData.response && helperData.response.toLowerCase().includes('techcorp')) {
          console.log(`✅ ${helperId} successfully accessed knowledge base!`)
          console.log(`   Preview: ${helperData.response.substring(0, 150)}...`)
        } else {
          console.log(`⚠️ ${helperId} responded but may not have accessed knowledge base`)
          console.log(`   Response: ${helperData.response?.substring(0, 150)}...`)
        }
      } else {
        console.log(`❌ Failed to get response from ${helperId}:`, helperResponse.statusText)
      }
    }
    
    console.log('\n🎉 Knowledge integration test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Only run if called directly
if (require.main === module) {
  testKnowledgeIntegration()
}

module.exports = { testKnowledgeIntegration }
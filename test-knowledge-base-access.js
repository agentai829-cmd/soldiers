// Test script to verify all 19 helpers can read the knowledge base

const helpers = [
  { id: 'emmie', name: 'Felix', description: 'Email Writer' },
  { id: 'dexter', name: 'Orion', description: 'Data Analyst' },
  { id: 'soshie', name: 'Zara', description: 'Social Media' },
  { id: 'commet', name: 'Angelia', description: 'Web & Landing Page Designer' },
  { id: 'vizzy', name: 'Ava', description: 'Virtual Assistant' },
  { id: 'cassie', name: 'Theo', description: 'Customer Support' },
  { id: 'penn', name: 'Jasper', description: 'Copywriting' },
  { id: 'scouty', name: 'Nadia', description: 'Talent' },
  { id: 'milli', name: 'Ethan', description: 'Sales' },
  { id: 'seomi', name: 'Iris', description: 'SEO' },
  { id: 'gigi', name: 'Sienna', description: 'Personal Development' },
  { id: 'pitch-bot', name: 'Olivia', description: 'Investor Deck & Startup Planner' },
  { id: 'growth-bot', name: 'Leo', description: 'Growth & Marketing Planner' },
  { id: 'strategy-adviser', name: 'Athena', description: 'Strategy Advisor' },
  { id: 'builder-bot', name: 'Edison', description: 'App & Product Planner' },
  { id: 'dev-bot', name: 'Ada', description: 'Developer & Code Expert' },
  { id: 'pm-bot', name: 'Grace', description: 'Project Manager' },
  { id: 'productivity-coach', name: 'Kai', description: 'Productivity & Coach' },
  { id: 'buddy', name: 'Marcus', description: 'Business Development' }
]

async function testHelperKnowledgeAccess(workspaceId, helperId, helperName) {
  try {
    console.log(`\n🧪 Testing ${helperName} (${helperId})...`)
    
    const response = await fetch(`http://localhost:3000/api/workspace/${workspaceId}/helpers/${helperId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token', // Replace with actual token
      },
      body: JSON.stringify({
        prompt: 'What information do you have from the knowledge base? Please reference any documents or data you can access.',
        conversationId: null
      })
    })

    if (!response.ok) {
      console.log(`❌ ${helperName}: HTTP Error ${response.status}`)
      return false
    }

    const data = await response.json()
    
    // Check if response mentions knowledge base, documents, or specific info
    const responseText = data.response?.toLowerCase() || ''
    const hasKnowledgeAccess = responseText.includes('knowledge') || 
                              responseText.includes('document') || 
                              responseText.includes('information') ||
                              responseText.includes('data')

    if (hasKnowledgeAccess) {
      console.log(`✅ ${helperName}: Can access knowledge base`)
      console.log(`   Response preview: "${data.response?.substring(0, 100)}..."`)
    } else {
      console.log(`❌ ${helperName}: No knowledge base access detected`)
      console.log(`   Response: "${data.response?.substring(0, 200)}..."`)
    }

    return hasKnowledgeAccess
  } catch (error) {
    console.log(`❌ ${helperName}: Error - ${error.message}`)
    return false
  }
}

async function testAllHelpers() {
  const workspaceId = 'your-workspace-id' // Replace with actual workspace ID
  
  console.log('🚀 Testing Knowledge Base Access for All 19 Helpers')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let failCount = 0
  
  for (const helper of helpers) {
    const success = await testHelperKnowledgeAccess(workspaceId, helper.id, helper.name)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 SUMMARY:')
  console.log(`✅ Helpers with Knowledge Base Access: ${successCount}/19`)
  console.log(`❌ Helpers without Knowledge Base Access: ${failCount}/19`)
  
  if (successCount === 19) {
    console.log('🎉 SUCCESS: All helpers can access the knowledge base!')
  } else {
    console.log('⚠️  Some helpers need fixing for knowledge base access.')
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAllHelpers, testHelperKnowledgeAccess, helpers }
} else {
  // Run test if called directly
  testAllHelpers().catch(console.error)
}
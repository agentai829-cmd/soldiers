const fetch = require('node-fetch')

async function testAdminAPI() {
  console.log('🧪 Testing Admin Dashboard API...\n')

  try {
    // Test subscriptions endpoint
    console.log('📡 Calling /api/admin/subscriptions...')
    const response = await fetch('http://localhost:3000/api/admin/subscriptions', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText)
      const text = await response.text()
      console.error('Response:', text)
      return
    }

    const data = await response.json()
    
    console.log('✅ API Response received')
    console.log('📊 Subscriptions count:', data.subscriptions?.length || 0)
    console.log('\n📋 Full Response:')
    console.log(JSON.stringify(data, null, 2))

    if (data.subscriptions && data.subscriptions.length > 0) {
      console.log('\n✅ Subscriptions found in database!')
      data.subscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. ${sub.userName} (${sub.userEmail})`)
        console.log(`   Workspace: ${sub.workspaceName}`)
        console.log(`   Plan: ${sub.planType}`)
        console.log(`   Interval: ${sub.interval || 'N/A'}`)
        console.log(`   Soldiers: ${sub.unlockedSoldiers?.join(', ') || 'None'}`)
        console.log(`   Status: ${sub.status}`)
      })
    } else {
      console.log('\n⚠️ No subscriptions found!')
      console.log('Possible issues:')
      console.log('1. Database has no subscriptions')
      console.log('2. API not returning data correctly')
      console.log('3. Workspace/User join failing')
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    console.error('\nMake sure:')
    console.error('1. Dev server is running: npm run dev')
    console.error('2. Database is accessible')
    console.error('3. .env variables are set')
  }
}

testAdminAPI()

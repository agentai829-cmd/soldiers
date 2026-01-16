// Test script to check user subscription
// Run: node test-user-subscription.js

const fetch = require('node-fetch')

async function testUserSubscription() {
  try {
    console.log('🧪 Testing /api/user/subscription endpoint...\n')
    
    // Note: You need to be logged in for this to work
    // This will work if you run it from browser console or after login
    
    const response = await fetch('http://localhost:3000/api/user/subscription', {
      headers: {
        'Cookie': process.env.COOKIE || '' // Add your session cookie here
      }
    })
    
    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers))
    
    const data = await response.json()
    
    console.log('\n📦 Response Data:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.subscription) {
      console.log('\n✅ SUCCESS - Subscription found!')
      console.log('   - Plan Type:', data.subscription.planType)
      console.log('   - Status:', data.subscription.status)
      console.log('   - Soldiers:', data.subscription.unlockedSoldiers?.length || 0)
    } else {
      console.log('\n⚠️ No subscription found')
      console.log('   Message:', data.message)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testUserSubscription()

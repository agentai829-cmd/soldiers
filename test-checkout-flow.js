// Test Stripe Checkout Flow
const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'

async function testCheckout() {
  console.log('🧪 Testing Stripe Checkout Flow...\n')
  
  try {
    // Test checkout session creation
    const response = await fetch('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId: workspaceId,
        purchaseType: 'single',
        agentName: 'Carl',
        planId: 'starter',
        interval: 'month'
      })
    })

    const data = await response.json()
    
    console.log('Response Status:', response.status)
    console.log('Response Data:', JSON.stringify(data, null, 2))
    
    if (data.url) {
      console.log('\n✅ Checkout session created successfully!')
      console.log('🔗 Checkout URL:', data.url)
      console.log('\n📝 Next steps:')
      console.log('1. Open this URL in browser')
      console.log('2. Use test card: 4242 4242 4242 4242')
      console.log('3. Any future date, any CVC')
    } else {
      console.log('\n❌ Failed to create checkout session')
      console.log('Error:', data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testCheckout()

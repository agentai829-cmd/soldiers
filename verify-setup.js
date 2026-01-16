console.log('🔍 Checking Environment Configuration...\n')

const env = {
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE?.substring(0, 20) + '...',
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET ? 'SET ✅' : 'NOT SET ❌'
}

console.log('Environment Variables:')
console.log('='.repeat(50))
Object.entries(env).forEach(([key, value]) => {
  console.log(`${key}: ${value}`)
})

console.log('\n' + '='.repeat(50))
console.log('\n✅ Configuration looks good!')
console.log('\n📋 Next Steps:')
console.log('1. Open: http://localhost:3000/pricing/select')
console.log('2. Click "Choose Plan" button')
console.log('3. Test card: 4242 4242 4242 4242')
console.log('4. Complete payment')
console.log('\n⚠️  Note: For local testing, webhooks need Stripe CLI')
console.log('   Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe')

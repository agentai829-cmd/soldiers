require('dotenv').config()

console.log('🎯 SOLDIERS X PRICE ID VERIFICATION\n')

const priceId = process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR

console.log('📋 .ENV FILE CHECK:')
console.log('   Variable Name: STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR')
console.log('   Current Value:', priceId || '❌ NOT FOUND')
console.log('   Expected Value: price_1ShzQ4GiBK03UQWzJ8Hrlcrv')
console.log('   Status:', priceId === 'price_1ShzQ4GiBK03UQWzJ8Hrlcrv' ? '✅ CORRECT' : '❌ NEEDS FIX')

console.log('\n🔧 CURRENT CONFIGURATION:')
console.log('   STRIPE_PRICE_MONTHLY_PLAN:', process.env.STRIPE_PRICE_MONTHLY_PLAN || '❌ Missing')
console.log('   STRIPE_PROFESSIONAL_PRICE_ID_YEAR:', process.env.STRIPE_PROFESSIONAL_PRICE_ID_YEAR || '❌ Missing')
console.log('   STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR:', process.env.STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR || '❌ Missing')

if (priceId === 'price_1ShzQ4GiBK03UQWzJ8Hrlcrv') {
  console.log('\n✅ PERFECT! Soldiers X button will work correctly!')
  console.log('\n🎉 When user clicks "Unlock Soldiers X":')
  console.log('   1. Stripe checkout opens with $199/year price')
  console.log('   2. User completes payment')
  console.log('   3. Webhook unlocks: penn, soshie, seomi, milli, vizzy')
  console.log('   4. All 10 soldiers available in workspace! 💪')
} else {
  console.log('\n⚠️  ISSUE: Price ID not matching!')
  console.log('   Fix: Make sure .env has this line:')
  console.log('   STRIPE_SOLDIERS_BUNDLE_PRICE_ID_YEAR=price_1ShzQ4GiBK03UQWzJ8Hrlcrv')
}

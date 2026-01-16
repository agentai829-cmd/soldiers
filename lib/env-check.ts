export function checkEnvVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ]
  
  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName]
    return !value || value === '' || value.includes('your_') || value.includes('sk_test_...')
  })
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars)
    return false
  }
  
  return true
}

export function isProductionReady() {
  const productionVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'OPENAI_API_KEY',
  ]
  
  const missingVars = productionVars.filter(varName => {
    const value = process.env[varName]
    return !value || value === '' || value.includes('your_') || value.includes('sk_test_...')
  })
  
  return missingVars.length === 0
}
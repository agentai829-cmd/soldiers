const { clerkClient } = require('@clerk/nextjs/server')

async function testClerkUsers() {
  try {
    console.log('\n=== Checking Clerk Users ===\n')
    
    let allClerkUsers = []
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset
      })
      
      const users = Array.isArray(response) ? response : response.data || []
      allClerkUsers = [...allClerkUsers, ...users]
      
      if (users.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }

    console.log(`Total Clerk users: ${allClerkUsers.length}\n`)
    
    // Find the two users we need
    const ahmed = allClerkUsers.find(u => u.id === 'user_35If2ED9vkZtr9flNl759sXk2Xa')
    const talha = allClerkUsers.find(u => u.id === 'user_35UGhA1N2FMheIE0VVOBwu5Timb')
    
    console.log('Ahmed found:', !!ahmed)
    if (ahmed) {
      console.log(`  Name: ${ahmed.firstName} ${ahmed.lastName}`)
      console.log(`  Email: ${ahmed.emailAddresses[0]?.emailAddress}`)
    }
    
    console.log('\nTalha found:', !!talha)
    if (talha) {
      console.log(`  Name: ${talha.firstName} ${talha.lastName}`)
      console.log(`  Email: ${talha.emailAddresses[0]?.emailAddress}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testClerkUsers()

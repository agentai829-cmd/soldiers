import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('👥 Fetching total Clerk users...')

    // Get all users from Clerk with pagination
    let allUsers: any[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset
      })
      
      const users = Array.isArray(response) ? response : response.data || []
      allUsers = [...allUsers, ...users]
      
      console.log(`📊 Fetched ${users.length} users (total: ${allUsers.length})`)
      
      // Check if there are more users
      if (users.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }

    console.log(`✅ Total Clerk users: ${allUsers.length}`)

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

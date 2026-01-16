import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('📊 Admin: Fetching all users and subscriptions...')

    // Get all workspaces with subscriptions and creator info
    const workspaces = await db.workspace.findMany({
      include: {
        billingSubscription: true,
        creator: true
      }
    })

    console.log(`✅ Found ${workspaces.length} workspaces`)
    console.log('📋 Sample workspace:', workspaces[0] ? {
      id: workspaces[0].id,
      name: workspaces[0].name,
      creatorId: workspaces[0].creatorId,
      creator: workspaces[0].creator,
      hasBilling: !!workspaces[0].billingSubscription
    } : 'No workspaces')

    // First, get all subscriptions from database
    const subscriptionsFromDB = workspaces
      .filter(w => w.billingSubscription)
      .map(w => {
        const sub = w.billingSubscription!
        console.log(`📝 Processing workspace: ${w.name}, creator:`, w.creator)
        return {
          id: sub.id,
          userName: w.creator?.name || 'Unknown User',
          userEmail: w.creator?.email || 'No Email',
          workspaceId: w.id,
          workspaceName: w.name,
          planType: sub.planType,
          interval: sub.interval || 'month',
          unlockedSoldiers: sub.unlockedSoldiers || [],
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          hasSubscription: true
        }
      })

    console.log(`✅ Found ${subscriptionsFromDB.length} subscriptions from DB`)
    console.log('📋 Sample subscription:', subscriptionsFromDB[0])

    // Get all Clerk users for users without subscriptions
    let allClerkUsers: any[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset
      })
      
      const users = Array.isArray(response) ? response : (response as any).data || []
      allClerkUsers = [...allClerkUsers, ...users]
      
      if (users.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }

    console.log(`✅ Found ${allClerkUsers.length} Clerk users`)

    // Then add Clerk users without subscriptions
    const usersWithoutSubs = allClerkUsers
      .filter(clerkUser => {
        // Check if this user already has a subscription
        const hasWorkspaceWithSub = workspaces.some(w => 
          w.creator?.clerkId === clerkUser.id && w.billingSubscription
        )
        return !hasWorkspaceWithSub
      })
      .map(clerkUser => {
        const userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown'
        const userEmail = clerkUser.emailAddresses.find((e: any) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || 'Unknown'
        const userWorkspace = workspaces.find(w => w.creator?.clerkId === clerkUser.id)
        
        return {
          id: clerkUser.id,
          userName,
          userEmail,
          workspaceId: userWorkspace?.id || null,
          workspaceName: userWorkspace?.name || 'No Workspace',
          planType: null,
          interval: null,
          unlockedSoldiers: [],
          status: null,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          hasSubscription: false
        }
      })

    // Combine both lists - subscriptions first, then users without subs
    const allUsersData = [...subscriptionsFromDB, ...usersWithoutSubs]

    console.log(`✅ Total users: ${allUsersData.length}`)
    console.log(`✅ With subscriptions: ${subscriptionsFromDB.length}`)
    console.log(`✅ Without subscriptions: ${usersWithoutSubs.length}`)

    return NextResponse.json({
      success: true,
      subscriptions: allUsersData
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

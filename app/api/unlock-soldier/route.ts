import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId, soldierName } = await request.json()

    if (!workspaceId || !soldierName) {
      console.log('❌ Missing fields:', { workspaceId, soldierName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`🔓 Unlocking ${soldierName} for workspace ${workspaceId}`)

    // Check if subscription exists
    const existingSubscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })

    console.log('📋 Existing subscription:', existingSubscription)

    if (existingSubscription) {
      // Update existing subscription
      const currentSoldiers = existingSubscription.unlockedSoldiers || []
      
      if (!currentSoldiers.includes(soldierName)) {
        const updatedSoldiers = [...currentSoldiers, soldierName]
        
        await db.billingSubscription.update({
          where: { workspaceId },
          data: {
            unlockedSoldiers: updatedSoldiers,
            status: 'ACTIVE'
          }
        })
        
        console.log(`✅ ${soldierName} unlocked successfully. Total soldiers:`, updatedSoldiers)
        return NextResponse.json({ 
          success: true, 
          unlockedSoldiers: updatedSoldiers 
        })
      } else {
        console.log(`⚠️ ${soldierName} already unlocked`)
        return NextResponse.json({ 
          success: true, 
          unlockedSoldiers: currentSoldiers,
          message: 'Already unlocked'
        })
      }
    } else {
      // Create new subscription
      const newSubscription = await db.billingSubscription.create({
        data: {
          workspaceId,
          planId: 'single',
          planType: 'single',
          unlockedSoldiers: [soldierName],
          status: 'ACTIVE',
          stripeSubscriptionId: `temp_${Date.now()}`, // Temporary ID for manual unlock
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      })
      
      console.log(`✅ New subscription created with ${soldierName}`)
      return NextResponse.json({ 
        success: true, 
        unlockedSoldiers: newSubscription.unlockedSoldiers 
      })
    }
  } catch (error) {
    console.error('Error unlocking soldier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { workspaceId, purchaseType } = await req.json()

    if (!workspaceId || !purchaseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🔓 Auto-unlocking soldiers after payment success:', { workspaceId, purchaseType })

    // Determine which soldiers to unlock
    let soldiers: string[] = []
    
    if (purchaseType === 'bundle') {
      soldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
      console.log('🎖️  Bundle: All 5 soldiers')
    } else if (purchaseType === 'professional') {
      soldiers = ['Carl', 'Paul', 'Olivia']
      console.log('🎖️  Professional: 3 soldiers')
    } else {
      soldiers = ['Carl']
      console.log('🎖️  Starter: 1 soldier')
    }

    // Check if subscription already exists
    const existingSubscription = await db.billingSubscription.findUnique({
      where: { workspaceId }
    })

    if (existingSubscription) {
      console.log('📝 Updating existing subscription')
      
      // Merge with existing soldiers
      const combinedSoldiers = Array.from(new Set([
        ...existingSubscription.unlockedSoldiers,
        ...soldiers
      ]))

      await db.billingSubscription.update({
        where: { workspaceId },
        data: {
          unlockedSoldiers: combinedSoldiers,
          status: 'ACTIVE',
          interval: purchaseType === 'professional' ? 'year' : 'month',
          planType: purchaseType,
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      console.log('✅ Subscription updated:', combinedSoldiers)
      
      return NextResponse.json({
        success: true,
        soldiers: combinedSoldiers
      })
    } else {
      console.log('📝 Creating new subscription')

      await db.billingSubscription.create({
        data: {
          workspaceId,
          planId: purchaseType,
          planType: purchaseType,
          interval: purchaseType === 'professional' ? 'year' : 'month',
          stripeCustomerId: 'auto_' + Date.now(),
          stripeSubscriptionId: 'auto_' + Date.now(),
          stripePriceId: 'auto_' + Date.now(),
          unlockedSoldiers: soldiers,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      console.log('✅ Subscription created:', soldiers)

      return NextResponse.json({
        success: true,
        soldiers
      })
    }
  } catch (error: any) {
    console.error('❌ Error auto-unlocking soldiers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unlock soldiers' },
      { status: 500 }
    )
  }
}

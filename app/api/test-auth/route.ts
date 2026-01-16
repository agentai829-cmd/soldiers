import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    const clerkUser = await currentUser()
    
    console.log('🔍 Clerk Auth Check:')
    console.log('- Clerk User ID:', userId)
    console.log('- Clerk User Email:', clerkUser?.emailAddresses[0]?.emailAddress)
    console.log('- Clerk User Name:', clerkUser?.firstName, clerkUser?.lastName)
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated',
        clerkUser: null,
        dbUser: null
      })
    }

    // Check if user exists in database
    let dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        members: {
          include: {
            workspace: true
          }
        }
      }
    })

    // If not exists, create user
    if (!dbUser && clerkUser) {
      console.log('✅ Creating new user in database...')
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          imageUrl: clerkUser.imageUrl,
        },
        include: {
          members: {
            include: {
              workspace: true
            }
          }
        }
      })
      console.log('✅ User created:', dbUser.email)
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication working',
      clerkUser: {
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress,
        name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
        imageUrl: clerkUser?.imageUrl
      },
      dbUser: dbUser ? {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        name: dbUser.name,
        workspaces: dbUser.members.length
      } : null
    })
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

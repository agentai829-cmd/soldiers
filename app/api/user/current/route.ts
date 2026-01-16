import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const email = user.emailAddresses[0]?.emailAddress

    return NextResponse.json({ 
      email,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

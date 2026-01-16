import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const userInDb = await db.user.findUnique({
    where: {
      clerkId: user.id,
    },
  })

  if (!userInDb) {
    redirect('/sign-in') // or "/onboarding"
  }

  redirect(`/dashboard/${userInDb.clerkId}`)
}

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
// import { db } from '@/lib/db'

export default async function HomePage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect('/sign-in')
  } else {
    return redirect('/dashboard')
  }

  // try {
  //   // Get user email from Clerk
  //   const clerkUser = await currentUser()
  //   const email = clerkUser?.emailAddresses[0]?.emailAddress

  //   if (email) {
  //     // Check if user has active subscription
  //     const dbUser = await db.user.findUnique({
  //       where: { email },
  //       select: {
  //         subscriptionStatus: true,
  //         subscriptionEndDate: true,
  //       },
  //     })

  //     // Check if subscription is active
  //     const hasActiveSubscription =
  //       dbUser?.subscriptionStatus === 'ACTIVE' ||
  //       dbUser?.subscriptionStatus === 'TRIALING'

  //     if (hasActiveSubscription) {
  //       // User has paid - redirect to workspace
  //       redirect('/workspace')
  //     } else {
  //       // User has NOT paid - redirect to pricing
  //       redirect('/pricing/select')
  //     }
  //   } else {
  //     // No email found - redirect to pricing by default
  //     redirect('/pricing/select')
  //   }
  // } catch (error) {
  //   console.error('Error checking subscription:', error)
  //   // On error, redirect to pricing to be safe
  //   redirect('/pricing/select')
  // }
}

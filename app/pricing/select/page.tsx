'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Lock, Zap, Users, Shield, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import '@/app/main-bg.css'
import { toast } from 'sonner'

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    subtitle: 'For Growing Teams',
    price: 20,
    interval: 'MONTH',
    icon: Zap,
    popular: true,
    features: [
      '5 AI Helpers',
      'Unlimited Conversations',
      'Email Support',
      'Standard AI Models',
      'Basic Workflows',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    subtitle: 'Perfect for Individuals',
    price: 40,
    interval: 'MONTH',
    icon: Users,
    popular: false,
    features: [
      '10 AI Helpers',
      'Unlimited Conversations',
      'Email Support',
      'Standard AI Models',
      'Basic Workflows',
    ],
  },
]

export default function PricingSelectPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)

  useEffect(() => {
    if (user && isLoaded) {
      try {
        const checkUserPendingSubscription = async () => {
          const res = await fetch(`/api/user/${user.id}/check-subscription`)
          if (res.ok) {
            const result = await res.json()
            if (result.hasValidSubscription) {
              router.push(`/dashboard/${user.id}`)
            }
          } else {
            router.push(`/dashboard`)
          }
        }
        checkUserPendingSubscription()
      } catch (error) {
        console.log('Error checking pending subscription:', error)
        router.push(`/dashboard`)
      }
    }
  }, [user, isLoaded])

  // useEffect(() => {
  //   if (user?.emailAddresses[0].emailAddress) {
  //     const checkUserPendingSubscription = async () => {
  //       const res = await fetch('/api/check-pending-subscription', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ email: user.emailAddresses[0].emailAddress }),
  //       })
  //       if (res.ok) {
  //         const result = await res.json()
  //         if (result.hasPendingSubscription) {
  //           router.push(`/workspace`)
  //           toast.success(
  //             `🎉 Your ${result.planType} subscription is now active!.`
  //           )
  //         }
  //       }
  //     }
  //     checkUserPendingSubscription()
  //   }
  // }, [user, isLoaded])

  // useEffect(() => {
  //   if (!isLoaded || !workspaceId) return

  //   const fetchBilling = async () => {
  //     try {
  //       const res = await fetch(`/api/workspace/${workspaceId}/billing`)
  //       if (!res.ok) return
  //       const data = await res.json()

  //       // Save unlocked soldiers for UI decisions
  //       setUnlockedSoldiersFromBilling(data.unlockedSoldiers || [])

  //       // If workspace has an active subscription, redirect to workspace
  //       if (data.isActive) {
  //         router.replace(`/workspace/${workspaceId}`)
  //       }
  //     } catch (err) {
  //       console.error('Error fetching billing status:', err)
  //     }
  //   }

  //   fetchBilling()
  // }, [isLoaded, workspaceId, router])

  // const fetchOrCreateWorkspace = async () => {
  //   try {
  //     // Fetch existing workspaces
  //     const response = await fetch('/api/workspaces')
  //     const workspaces = await response.json()

  //     if (workspaces && workspaces.length > 0) {
  //       setWorkspaceId(workspaces[0].id)
  //     } else {
  //       // Create a default workspace
  //       const createResponse = await fetch('/api/workspaces', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           name: `${user?.firstName}'s Workspace`,
  //           slug: `workspace-${Date.now()}`,
  //         }),
  //       })

  //       if (createResponse.ok) {
  //         const newWorkspace = await createResponse.json()
  //         setWorkspaceId(newWorkspace.id)
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching/creating workspace:', error)
  //   }
  // }

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId)
    const clerkId = user?.id
    const email = user?.emailAddresses[0]?.emailAddress
    if (!clerkId || !email) {
      console.error('User not authenticated')
      setLoadingPlan(null)
      return
    }

    // Resolve selected plan early so interval is available for checkout
    const selectedPlan = plans.find((p) => p.id === planId)

    try {
      // Both Starter and Professional plans unlock the same upper 5 helpers
      // Helpers: Bob (buddy), Lisa (pitch-bot), Leo (growth-bot), Ada (dev-bot), Grace (pm-bot)
      // Soldiers (Jasper, Zara, Iris, Ethan, Ava) remain LOCKED - available as separate upgrade
      const purchaseType = 'SUBSCRIPTION'

      // Normal plan checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType,
          planId,
          email,
          clerkId,
        }),
      })

      const data = await response.json()

      console.log('Checkout response:', { status: response.status, data })

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No URL in response:', data)
        alert(
          `Failed to create checkout session: ${data.error || 'Unknown error'}`
        )
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert(
        `An error occurred: ${error instanceof Error ? error.message : 'Please try again'}`
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  if (!isLoaded) {
    return (
      <div className="main-page-bg flex min-h-screen items-center justify-center">
        <div className="rounded-2xl bg-black/50 p-8 text-center backdrop-blur-md">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-yellow-500" />
          <p className="text-lg text-white">
            {!isLoaded
              ? 'Verifying user...'
              : isCheckingSubscription
                ? 'Checking subscription...'
                : ''}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-page-bg min-h-screen bg-black px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-black/40 p-5 text-center backdrop-blur-md">
          <div className="mb-2 inline-block">
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[11px] font-semibold text-white">
              Welcome to Soldiers AI
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white drop-shadow-lg">
            Choose Your AI Soldiers
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-200 drop-shadow-md">
            Select a plan to unlock your AI helpers and start automating your
            work
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mb-8 grid max-w-[950px] gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            return (
              <div
                key={plan.id}
                className="relative overflow-hidden rounded-2xl border border-yellow-500 bg-black shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-yellow-400"
              >
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="rounded-lg border border-yellow-500 bg-yellow-500/20 p-2">
                      <IconComponent className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-white">{plan.subtitle}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="ml-1.5 text-base text-white">
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className="mb-4 h-10 w-full border border-yellow-500 bg-gradient-to-r from-yellow-600 to-yellow-500 text-base font-semibold text-white transition-all hover:from-yellow-500 hover:to-yellow-400"
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing....
                      </>
                    ) : (
                      <>Choose Plan</>
                    )}
                  </Button>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                        <span className="text-sm text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Soldiers X remain locked - available as separate upgrade later */}
      </div>
    </div>
  )
}

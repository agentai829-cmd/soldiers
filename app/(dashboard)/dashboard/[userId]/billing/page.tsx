'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'

interface Subscription {
  id: string
  workspaceId: string
  workspaceName: string
  planType: string
  interval?: string
  status: string
  currentPeriodEnd: string
  stripeSubscriptionId: string
  unlockedSoldiers: string[]
  createdAt: string
  price?: number
  currency?: string
}

export default function BillingPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching subscription data...')

      const response = await fetch('/api/user/subscription', {
        cache: 'no-store',
      })

      console.log('📡 API Response Status:', response.status)

      const data = await response.json()
      console.log('📦 API Response Data:', data)

      if (data.error) {
        console.error('❌ API Error:', data.error)
        setError(data.error)
        return
      }

      if (data.subscription) {
        console.log('✅ Subscription loaded:', data.subscription)
        setSubscription(data.subscription)
      } else {
        console.log('⚠️ No subscription found in response')
        console.log(
          '💡 Make sure you are logged in with one of these accounts:'
        )
        console.log('   - saad.outsourceorigin@gmail.com')
        console.log('   - outsourceorigin@gmail.com')
        console.log('   - bushraoutsoureceorigin@gmail.com')
        console.log('   - talhaoffice27@gmail.com')
      }
    } catch (error) {
      console.error('❌ Error fetching subscription:', error)
      setError('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  // const handleCancelSoldiersX = async () => {
  //   if (!subscription) return

  //   const confirmed = confirm('Are you sure you want to cancel Soldiers X? This will remove penn, soshie, seomi, milli, and vizzy from your subscription.')

  //   if (!confirmed) return

  //   try {
  //     setCancelling(true)
  //     const response = await fetch('/api/user/cancel-soldiers-x', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         subscriptionId: subscription.id,
  //       }),
  //     })

  //     const data = await response.json()

  //     if (data.success) {
  //       alert('Soldiers X cancelled successfully!')
  //       fetchSubscription()
  //     } else {
  //       alert('Failed to cancel: ' + (data.error || 'Unknown error'))
  //     }
  //   } catch (error) {
  //     alert('Failed to cancel Soldiers X')
  //   } finally {
  //     setCancelling(false)
  //   }
  // }

  // const handleCancelSubscription = async () => {
  //   if (!subscription) return

  //   const confirmed = confirm('Are you sure you want to cancel your subscription? This will lock all soldiers immediately.')

  //   if (!confirmed) return

  //   try {
  //     setCancelling(true)
  //     const response = await fetch('/api/user/cancel-subscription', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         subscriptionId: subscription.id,
  //       }),
  //     })

  //     const data = await response.json()

  //     if (data.success) {
  //       alert('Subscription cancelled successfully!')
  //       // Redirect to pricing selection page
  //       router.push('/pricing/select')
  //     } else {
  //       alert('Failed to cancel: ' + (data.error || 'Unknown error'))
  //     }
  //   } catch (error) {
  //     alert('Failed to cancel subscription')
  //   } finally {
  //     setCancelling(false)
  //   }
  // }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-black">
        <div className="text-center">
          <style jsx>{`
            .custom-loader {
              width: 60px;
              aspect-ratio: 1;
              border: 15px solid #444;
              border-radius: 50%;
              position: relative;
              transform: rotate(45deg);
              margin: 0 auto 1rem;
            }
            .custom-loader::before {
              content: '';
              position: absolute;
              inset: -15px;
              border-radius: 50%;
              border: 15px solid #f59e0b;
              animation: l18 1s infinite linear;
            }
            @keyframes l18 {
              0% {
                clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
              }
              25% {
                clip-path: polygon(
                  50% 50%,
                  0 0,
                  100% 0,
                  100% 0,
                  100% 0,
                  100% 0
                );
              }
              50% {
                clip-path: polygon(
                  50% 50%,
                  0 0,
                  100% 0,
                  100% 100%,
                  100% 100%,
                  100% 100%
                );
              }
              75% {
                clip-path: polygon(
                  50% 50%,
                  0 0,
                  100% 0,
                  100% 100%,
                  0 100%,
                  0 100%
                );
              }
              100% {
                clip-path: polygon(
                  50% 50%,
                  0 0,
                  100% 0,
                  100% 100%,
                  0 100%,
                  0 0
                );
              }
            }
          `}</style>
          <div className="custom-loader"></div>
          <p className="text-white">Loading billing information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-black">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="font-medium text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex-1 bg-black p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border-2 border-yellow-500 bg-gray-900 p-8 text-center shadow-md">
            <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h2 className="mb-2 text-xl font-bold text-white">
              No Active Subscription
            </h2>
            <p className="mb-6 text-gray-400">
              You don't have an active subscription
            </p>
            <Button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Workspace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1 bg-black p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-white">Subscription</h1>
          <p className="text-gray-400">Manage your subscription</p>
        </div>

        <div className="rounded-xl border-2 border-yellow-500 bg-gray-900 p-6 shadow-md">
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">
                Current Subscription
              </h2>
            </div>

            {/* Base Plan */}
            <div className="mb-3 rounded-lg bg-blue-900/30 p-4">
              <p className="mb-1 text-sm text-gray-400">Base Plan</p>
              <p className="text-2xl font-bold text-white">
                {subscription.interval === 'year'
                  ? 'Yearly Plan'
                  : 'Monthly Plan'}
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-400">
                {subscription.interval === 'year' ? '$200/year' : '$20/month'}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Bundle Soldiers (
                {
                  subscription.unlockedSoldiers.filter((s) =>
                    [
                      'buddy',
                      'pitch-bot',
                      'growth-bot',
                      'dev-bot',
                      'pm-bot',
                    ].includes(s)
                  ).length
                }
                )
              </p>
            </div>

            {/* Soldiers X Add-on (if present) */}
            {subscription.unlockedSoldiers.some((s) =>
              ['penn', 'soshie', 'seomi', 'milli', 'vizzy'].includes(s)
            ) && (
              <div className="mb-3 rounded-lg bg-yellow-900/30 p-4">
                <p className="mb-1 text-sm text-gray-400">Add-on</p>
                <p className="text-xl font-bold text-white">Soldiers X</p>
                <p className="mt-1 text-lg font-semibold text-yellow-400">
                  +$79/month
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Premium Soldiers (
                  {
                    subscription.unlockedSoldiers.filter((s) =>
                      ['penn', 'soshie', 'seomi', 'milli', 'vizzy'].includes(s)
                    ).length
                  }
                  )
                </p>
              </div>
            )}

            {/* Next Renewal */}
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="mb-1 text-sm text-gray-400">Next Renewal</p>
              <p className="text-lg font-semibold text-white">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </div>

          {/* <>
          {subscription.status === 'ACTIVE' && subscription.unlockedSoldiers.some(s => ['penn', 'soshie', 'seomi', 'milli', 'vizzy'].includes(s)) && (
            <div className="border-t pt-6">
              <Button
                onClick={handleCancelSoldiersX}
                disabled={cancelling}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Soldiers X'
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                This will remove only Soldiers X from your subscription
              </p>
            </div>
          )}

          {subscription.status === 'ACTIVE' && (
              <div className="border-t pt-6">
                <Button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  variant="destructive"
                  className="w-full"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Cancelling will lock all soldiers immediately
                </p>
              </div>
            )}
                </> */}
        </div>
      </div>
    </div>
  )
}

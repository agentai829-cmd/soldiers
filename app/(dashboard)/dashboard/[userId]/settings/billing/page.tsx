'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CreditCard, Calendar, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Subscription {
  id: string
  status: string
  planName: string
  amount: number
  interval: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export default function BillingPage({ params }: { params: { workspaceId: string } }) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [params.workspaceId])

  const fetchSubscription = async () => {
    try {
      // Add cache busting to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/stripe/subscription?workspaceId=${params.workspaceId}&t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (data.subscription) {
        setSubscription(data.subscription)
      } else {
        // No subscription found, clear state
        setSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    setCanceling(true)
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: params.workspaceId }),
      })

      if (response.ok) {
        await fetchSubscription()
        alert('Subscription canceled successfully')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setCanceling(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: params.workspaceId }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/workspace/${params.workspaceId}`)}
          >
            ← Back to Workspace
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        {!subscription ? (
          <Card className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Subscription
            </h2>
            <p className="text-gray-600 mb-6">
              Upgrade your workspace to unlock premium features
            </p>
            <Button
              onClick={() => router.push(`/workspace/${params.workspaceId}/pricing`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              View Plans
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Current Plan
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Plan</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {subscription.planName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Amount</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${subscription.amount}/{subscription.interval === 'year' ? 'year' : 'month'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Next billing date</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleManageBilling}
                className="flex-1"
                variant="outline"
              >
                Manage Payment Methods
              </Button>
              
              {!subscription.cancelAtPeriodEnd && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  variant="destructive"
                  className="flex-1"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              )}
            </div>

            {subscription.cancelAtPeriodEnd && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <p className="text-yellow-800">
                  Your subscription will be canceled at the end of the current billing period.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      '1 Workspace',
      '3 AI Helpers',
      '100 Automations/month',
      '1,000 Knowledge docs',
      'Basic integrations',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    popular: true,
    features: [
      '5 Workspaces',
      'Unlimited AI Helpers',
      '500 Automations/month',
      '10,000 Knowledge docs',
      'All integrations',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited Workspaces',
      'Unlimited AI Helpers',
      'Unlimited Automations',
      'Unlimited Knowledge docs',
      'Custom integrations',
      'Dedicated support',
      'SSO & advanced security',
    ],
  },
]

export default function PricingPage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const router = useRouter()
  const { user } = useUser()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId)
    const clerkId = user?.id
    const email = user?.emailAddresses[0]?.emailAddress
    if (!clerkId || !email) {
      console.error('User not authenticated')
      setLoadingPlan(null)
      return
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: params.workspaceId,
          planId,
          email,
          clerkId,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your team
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl bg-white shadow-lg ${
                plan.popular ? 'scale-105 ring-2 ring-purple-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-purple-500 px-4 py-1 text-sm font-semibold text-white">
                  Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="ml-2 text-gray-600">/{plan.interval}</span>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`mb-6 w-full ${
                    plan.popular
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/workspace/${params.workspaceId}`)}
          >
            Back to Workspace
          </Button>
        </div>
      </div>
    </div>
  )
}

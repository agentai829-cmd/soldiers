'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function SuccessPage({ params }: { params: { workspaceId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const soldier = searchParams.get('soldier') || 'Carl' // Get soldier name from URL
    
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    // Verify the session and unlock soldier(s)
    const unlockSoldiers = async () => {
      try {
        const verifyRes = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const verifyData = await verifyRes.json()
        
        if (verifyData.error) {
          setError(verifyData.error)
          return
        }

        // If bundle, unlock all 5 soldiers
        if (soldier === 'bundle') {
          const soldiers = ['Carl', 'Paul', 'Olivia', 'Wendy', 'Dave']
          await Promise.all(
            soldiers.map(s => 
              fetch('/api/unlock-soldier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  workspaceId: params.workspaceId,
                  soldierName: s
                })
              })
            )
          )
          console.log(`✅ All 5 soldiers unlocked!`)
        } else {
          // Single soldier unlock
          const unlockRes = await fetch('/api/unlock-soldier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: params.workspaceId,
              soldierName: soldier
            })
          })
          const unlockData = await unlockRes.json()
          
          if (unlockData.error) {
            console.error('Unlock error:', unlockData.error)
          } else {
            console.log(`✅ ${soldier} unlocked successfully!`)
          }
        }
      } catch (err) {
        console.error('Payment verification failed:', err)
        setError('Failed to verify payment')
      } finally {
        setLoading(false)
      }
    }

    unlockSoldiers()
  }, [searchParams, params.workspaceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg p-8">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push(`/workspace/${params.workspaceId}/pricing`)}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              Back to Pricing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for subscribing. Your workspace has been upgraded successfully.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => {
                // Force reload to clear cache and fetch fresh subscription data
                window.location.href = `/workspace/${params.workspaceId}`
              }}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Go to Workspace
            </Button>
            
            <Button
              onClick={() => router.push(`/workspace/${params.workspaceId}/settings/billing`)}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              View Billing Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

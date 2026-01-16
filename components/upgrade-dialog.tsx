'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Zap, Lock } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { toast } from 'sonner'

interface UpgradeDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function UpgradeDialog({ isOpen, setIsOpen }: UpgradeDialogProps) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [isLoading, setLoading] = useState(false)

  const handleCancel = () => {
    setIsOpen(false)
  }

  const handleUpgrade = async () => {
    if (!isLoaded || !user) return

    const clerkId = user.id
    const email = user.emailAddresses[0]?.emailAddress
    if (!clerkId || !email) {
      console.error('User not authenticated')
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'SOLDIERSX',
          agentName: 'builder-bot,dev-bot,pm-bot,commet,soshie',
          planId: 'SOLDIERSX',
          email,
          clerkId,
        }),
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
            <Bot className="h-6 w-6 text-blue-500" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Unlock All AI Agents
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upgrade to get access to all remaining AI agents for a full year.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Zap className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span>
              Access to <strong>all AI agents</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Zap className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span>Specialized agents for coding, writing, analysis</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Zap className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span>
              <strong>1 full year</strong> of unlimited usage
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              No more agent limitations
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Stay Limited
          </Button>
          <Button
            disabled={isLoading}
            onClick={handleUpgrade}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            {isLoading ? 'Please wait...' : 'Unlock Agents'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

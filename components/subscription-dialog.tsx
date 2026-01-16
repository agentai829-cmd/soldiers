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
import { Sparkles, Crown } from 'lucide-react'

interface SubscriptionDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const SubscriptionDialog = ({
  isOpen,
  setIsOpen,
}: SubscriptionDialogProps) => {
  const router = useRouter()

  const handleUpgrade = () => {
    setIsOpen(false)
    router.push('/pricing/select')
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Get access to advanced features and unlimited usage with our premium
            plans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>Unlimited AI conversations</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>Advanced workspace features</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>Priority support</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-primary hover:bg-primary/90"
          >
            View Plans
            <Badge variant="secondary" className="ml-2 text-xs">
              Pro
            </Badge>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ExpiredDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const ExpiredDialog = ({ isOpen, setIsOpen }: ExpiredDialogProps) => {
  const router = useRouter()

  const handleRenew = () => {
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Subscription Expired
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your subscription has expired. Please renew to continue using
            premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
            <span>Resume unlimited AI conversations</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
            <span>Access advanced workspace features</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
            <span>Get priority support again</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Not Now
          </Button>
          <Button
            onClick={handleRenew}
            className="bg-primary hover:bg-primary/90"
          >
            Renew Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

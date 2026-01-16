'use client'

import { Button } from '@/components/ui/button'
import { Bell, Search, User } from 'lucide-react'

const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here' &&
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== ''

interface HeaderProps {
  title?: string
  workspace?: any
}

function DemoUserButton() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <User className="h-4 w-4 text-gray-600" />
      </div>
      <span className="text-sm text-gray-600">Demo User</span>
    </div>
  )
}

async function ClerkUserButton() {
  if (!hasClerkKeys) return <DemoUserButton />
  
  try {
    const { UserButton } = await import('@clerk/nextjs')
    return <UserButton afterSignOutUrl="/sign-in" />
  } catch (error) {
    return <DemoUserButton />
  }
}

export function Header({ title, workspace }: HeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          
          {hasClerkKeys ? <ClerkUserButton /> : <DemoUserButton />}
        </div>
      </div>
    </div>
  )
}
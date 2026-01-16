'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ClearAuthPage() {
  const { signOut } = useClerk()
  const {user} = useUser()
  user?.emailAddresses
  const router = useRouter()

  const handleClearAuth = async () => {
    try {
      // Sign out from Clerk
      await signOut()
      
      // Clear all local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error clearing auth:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-xl border border-yellow-500/30 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Clear Authentication</h1>
        <p className="text-gray-300 mb-6">
          Click below to clear all authentication data and sessions.
        </p>
        <Button 
          onClick={handleClearAuth}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
        >
          Clear Auth & Sign Out
        </Button>
        <p className="text-sm text-gray-400 mt-4">
          This will log you out and clear all stored sessions.
        </p>
      </div>
    </div>
  )
}

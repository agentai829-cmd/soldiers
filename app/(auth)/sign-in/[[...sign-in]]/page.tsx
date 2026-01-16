'use client'

import { useEffect, useState } from 'react'

const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here' &&
                    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== ''

export default function SignInPage() {
  const [SignInComponent, setSignInComponent] = useState<any>(null)

  useEffect(() => {
    if (hasClerkKeys) {
      import('@clerk/nextjs').then(({ SignIn }) => {
        setSignInComponent(() => SignIn)
      })
    }
  }, [])

  if (!hasClerkKeys) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-4">Sign In</h1>
          <p className="text-center text-gray-600 mb-6">
            Clerk authentication is not configured. Please add your Clerk API keys to .env.local
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/workspace/demo'} 
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              Continue to Demo (No Auth)
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!SignInComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <SignInComponent 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
              card: 'shadow-lg border border-gray-200',
            },
          }}
        />
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Users, ArrowRight, Briefcase, User } from 'lucide-react'
import { toast } from 'sonner'

interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  role: string
}

export default function WorkspacePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && user) {
      fetchWorkspaces()
    }
  }, [isLoaded, user, router])

  // useEffect(() => {
  //   if (user?.emailAddresses[0].emailAddress) {
  //     const checkUserPendingSubscription = async () => {
  //       const res = await fetch('/api/check-pending-subscription', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ email: user.emailAddresses[0].emailAddress }),
  //       })
  //       if (res.ok) {
  //         const result = await res.json()
  //         if (result.hasPendingSubscription) {
  //           toast.success(
  //             `🎉 Your ${result.planType} subscription is now active!.`
  //           )
  //         }
  //       }
  //     }
  //     checkUserPendingSubscription()
  //   }
  // }, [user, isLoaded])

  const fetchWorkspaces = async () => {
    let shouldRedirect = false
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        console.log('Workspaces fetched:', data.length)
        setWorkspaces(data)

        // Auto-redirect to first workspace if available
        if (data && data.length > 0) {
          // If Stripe appended a session_id to the URL after checkout,
          // verify it before checking subscription so webhooks aren't required
          try {
            const params = new URLSearchParams(window.location.search)
            const sessionId = params.get('session_id')
            if (sessionId) {
              console.log('Found session_id in URL, verifying:', sessionId)
              await fetch(
                `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`
              )
              // Remove session_id from URL to avoid re-running
              const url = new URL(window.location.href)
              url.searchParams.delete('session_id')
              window.history.replaceState({}, '', url.toString())
            }
          } catch (verifyErr) {
            console.error('Error verifying session_id:', verifyErr)
          }

          // Check subscription status before redirecting
          try {
            const subResponse = await fetch(
              `/api/workspace/${data[0].id}/subscription`
            )
            const subData = await subResponse.json()

            console.log('Subscription check:', subData)

            // If user has any unlocked soldiers, redirect to workspace
            if (
              subData.unlockedSoldiers &&
              subData.unlockedSoldiers.length > 0
            ) {
              console.log(
                'User has unlocked soldiers:',
                subData.unlockedSoldiers
              )
              console.log('Redirecting to workspace:', data[0].id)
              setIsRedirecting(true)
              router.replace(`/workspace/${data[0].id}`)
              return
            }

            // No soldiers unlocked - redirect to pricing
            console.log('No soldiers unlocked, redirecting to pricing')
            router.replace('/pricing/select')
            return
          } catch (subError) {
            console.error('Error checking subscription:', subError)
            // If check fails, redirect to pricing to be safe
            console.log('Subscription check failed, redirecting to pricing')
            router.replace('/pricing/select')
            return
          }
        } else {
          console.log('No workspaces found')
        }
      } else {
        console.error('Failed to fetch workspaces:', response.status)
        setWorkspaces([])
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      setWorkspaces([])
    } finally {
      // Only set loading to false if not redirecting
      if (!shouldRedirect) {
        setLoading(false)
      }
    }
  }

  const handleWorkspaceSelect = (workspaceId: string) => {
    setIsRedirecting(true)
    router.push(`/workspace/${workspaceId}`)
  }

  if (!isLoaded || loading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
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
          <p className="text-sm text-white">Loading your workspaces</p>
          <p className="mt-1 text-xs text-gray-400">
            Please wait while we fetch your data...
          </p>
        </div>
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
            <Briefcase className="h-10 w-10 text-black" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Welcome to Soldiers!
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-300">
            Transform your productivity with AI-powered workspaces. Create your
            first workspace to get started with intelligent automation and
            seamless collaboration.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/workspace/create')}
              className="transform rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 px-8 py-3 text-lg font-semibold text-black shadow-lg transition-all hover:scale-105 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Workspace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'member':
        return <User className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'member':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <div className="sticky top-0 z-10 border-b border-yellow-500/30 bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                Your Workspaces
              </h1>
              <p className="mt-1 text-gray-300">
                Choose a workspace to continue your journey
              </p>
            </div>
            <Button
              onClick={() => router.push('/workspace/create')}
              className="w-full transform rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-2 text-black shadow-lg transition-all hover:scale-105 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Workspace Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-yellow-500/30 bg-gray-900/70 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                  <Briefcase className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {workspaces.length}
                  </p>
                  <p className="text-sm text-gray-400">Total Workspaces</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-gray-900/70 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                  <User className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {workspaces.length}
                  </p>
                  <p className="text-sm text-gray-400">Active</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-gray-900/70 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                  <Users className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {
                      workspaces.filter(
                        (w) => w.role.toLowerCase() === 'member'
                      ).length
                    }
                  </p>
                  <p className="text-sm text-gray-400">Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="group cursor-pointer overflow-hidden border-yellow-500/30 bg-gray-900/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20"
              onClick={() => handleWorkspaceSelect(workspace.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-lg font-semibold text-white transition-colors group-hover:text-yellow-500">
                      {workspace.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2 text-gray-400">
                      {workspace.description ||
                        'Your personal workspace for AI-powered productivity'}
                    </CardDescription>
                  </div>
                  <div className="ml-3 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
                    <span className="text-lg font-bold text-black">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* {getRoleIcon(workspace.role)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRoleColor(workspace.role)}`}>
                      {workspace.role.charAt(0).toUpperCase() + workspace.role.slice(1)}
                    </span> */}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 transition-colors group-hover:text-yellow-500">
                    <span className="text-sm font-medium">Open</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Hover Effect Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transform bg-gradient-to-r from-yellow-500 to-yellow-600 transition-transform duration-300 group-hover:scale-x-100"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Actions */}
        <div className="mt-12 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl border border-yellow-500/30 bg-gray-900/70 p-8 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Plus className="h-8 w-8 text-black" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Need another workspace?
            </h3>
            <p className="mb-6 text-gray-300">
              Create additional workspaces to organize different projects or
              collaborate with different teams.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/workspace/create')}
              className="border-yellow-500 px-6 py-2 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

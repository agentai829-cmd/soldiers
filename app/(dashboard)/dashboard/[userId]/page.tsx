'use client'

import dynamic from 'next/dynamic'
import '@/app/main-bg.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Paperclip, Search, X, User, Loader2Icon } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UpgradeDialog } from '@/components/upgrade-dialog'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { SubscriptionDialog } from '@/components/subscription-dialog'
import { ExpiredDialog } from '@/components/expired-dialog'

// Lazy load non-critical components for faster initial page load
const UseCasesSection = dynamic(
  () =>
    import('@/components/use-cases/use-cases-section').then((mod) => ({
      default: mod.UseCasesSection,
    })),
  {
    ssr: true,
    loading: () => (
      <div className="mx-4 h-32 animate-pulse rounded-lg bg-gray-50/50" />
    ),
  }
)
const CreateHelperDialog = dynamic(
  () =>
    import('@/components/helpers/create-helper-dialog').then((mod) => ({
      default: mod.CreateHelperDialog,
    })),
  { ssr: false }
)

interface HomePageProps {
  params: {
    userId: string
  }
}

const allAgents = [
  {
    id: 'buddy',
    name: 'Bob',
    role: 'Buzz Builder',
    category: 'Startup & Business Growth',
    keywords: ['business', 'development', 'strategy', 'growth', 'planning'],
    avatar: '/Avatar/Business-Development.mp4',
    comingSoon: false,
  },
  {
    id: 'pitch-bot',
    name: 'Lisa',
    role: 'Loyalty',
    category: 'Startup & Business Growth',
    keywords: [
      'pitch',
      'investor',
      'deck',
      'startup',
      'planning',
      'presentation',
    ],
    avatar: '/Avatar/Pitch Bot.mp4',
    comingSoon: false,
  },
  {
    id: 'growth-bot',
    name: 'Ricky',
    role: 'Reputation',
    category: 'Startup & Business Growth',
    keywords: ['growth', 'marketing', 'planner', 'scale', 'expansion'],
    avatar: '/Avatar/Growth Bot.mp4',
    comingSoon: false,
  },
  {
    id: 'strategy-adviser',
    name: 'Emma',
    role: 'Search Engine',
    category: 'Startup & Business Growth',
    keywords: ['growth', 'marketing', 'planner', 'scale', 'expansion'],
    avatar: '/Avatar/Strategy Advisor.mp4',
    comingSoon: false,
  },
  {
    id: 'penn',
    name: 'Sarah',
    role: 'Local Celebrity',
    category: 'Marketing & Content',
    keywords: ['copywriting', 'content', 'writing', 'copy', 'marketing'],
    avatar: '/Avatar/Copy Writer.mp4',
    comingSoon: false,
  },
  {
    id: 'builder-bot',
    name: 'Carl',
    role: 'Competition Crusher',
    category: 'Marketing & Content',
    keywords: ['copywriting', 'content', 'writing', 'copy', 'marketing'],
    avatar: '/Avatar/Builder-Bot.mp4',
    comingSoon: false,
  },
  {
    id: 'dev-bot',
    name: 'Paul',
    role: 'Profit Maximizer',
    category: 'Product & Tech',
    keywords: ['developer', 'code', 'programming', 'tech', 'coding'],
    avatar: '/Avatar/Dev Bot.mp4',
    comingSoon: false,
  },
  {
    id: 'pm-bot',
    name: 'Olivia',
    role: 'Offer Fixer',
    category: 'Product & Tech',
    keywords: ['project', 'manager', 'management', 'coordination', 'planning'],
    avatar: '/Avatar/PM Bot.mp4',
    comingSoon: false,
  },
  {
    id: 'commet',
    name: 'Wendy',
    role: 'Customer Whisperer',
    category: 'Product & Tech',
    keywords: ['project', 'manager', 'management', 'coordination', 'planning'],
    avatar: '/Avatar/Web-Buider.mp4',
    comingSoon: false,
  },
  {
    id: 'soshie',
    name: 'Dave',
    role: 'Local Dominance',
    category: 'Marketing & Content',
    keywords: ['social', 'media', 'posts', 'content', 'engagement'],
    avatar: '/Avatar/Social Media.mp4',
    comingSoon: false,
  },
]

export default function HomePage({ params }: HomePageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedHelper, setSelectedHelper] = useState<string>('')
  const [unlockedSoldiers, setUnlockedSoldiers] = useState<string[]>([])
  const [isHelperLoading, setIsHelperLoading] = useState(false)
  const [choosedHelper, setChoosedHelper] = useState<string>('')
  const [hasValidSubscription, setHasValidSubscription] = useState<
    'VALID' | 'EXPIRED' | 'NOT_FOUND'
  >('NOT_FOUND')
  const [subscriptionDialog, setSubscriptionDialog] = useState(false)
  const [expiredDialog, setExpiredDialog] = useState(false)

  const { user, isLoaded } = useUser()
  // Use actual soldier IDs from database (agent IDs, not display names)

  const hasAllSoldiersUnlocked =
    Array.isArray(unlockedSoldiers) && unlockedSoldiers.length > 5

  const searchRef = useRef<HTMLDivElement>(null)

  // Function to refresh subscription data
  useEffect(() => {
    if (params.userId) {
      const refreshSubscription = async () => {
        try {
          setIsLoading(true)
          const response = await fetch(
            `/api/user/${params.userId}/subscription`,
            {
              cache: 'no-store',
            }
          )
          if (response.ok) {
            const subData = await response.json()
            console.log(
              '🔄 Refreshed unlocked soldiers:',
              subData.unlockedSoldiers
            )
            setUnlockedSoldiers(subData.unlockedSoldiers || [])
            setHasValidSubscription(subData.hasValidSubscription)
          }
        } catch (error) {
          // Silent error handling for better performance
        } finally {
          setIsLoading(false)
        }
      }
      refreshSubscription()
    }
  }, [params.userId])

  console.log(hasValidSubscription)

  // Get workspace info and unlocked soldiers
  // useEffect(() => {
  //   if (!user || !user.id) return
  //   const fetchData = async () => {
  //     try {
  //       setIsLoading(true)
  //       const res = await fetch(
  //         `/api/workspaces/${params.workspaceId}/${user?.id}`
  //       )
  //       if (res.ok) {
  //         const data = await res.json()
  //         const { unlockedSoldiers, workspace } = data
  //         setUnlockedSoldiers(unlockedSoldiers)
  //         setWorkspace(workspace)
  //       } else {
  //         console.log('Something went wrong request not valid')
  //       }
  //     } catch (error) {
  //       console.log(error)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }
  //   fetchData()
  // }, [params.workspaceId, user])

  // Fetch workspace data and subscription status
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // BACKGROUND AUTO-SYNC: Always check if user needs sync (runs silently)
  //       const user = await fetch('/api/user/current')
  //         .then((r) => (r.ok ? r.json() : null))
  //         .catch(() => null)
  //       // if (user?.email) {
  //       //   // Silent background check - does NOT interrupt user
  //       //   fetch(`/api/auto-sync?email=${encodeURIComponent(user.email)}`)
  //       //     .then(r => r.json())
  //       //     .then(data => {
  //       //       if (data.synced && !data.alreadyActive) {
  //       //         console.log('🔄 Background sync completed!')
  //       //         console.log('   Synced:', data.plan, 'plan')
  //       //         console.log('   Soldiers:', data.soldiers)
  //       //         // Refresh data after background sync
  //       //         refreshSubscription()
  //       //       }
  //       //     })
  //       //     .catch(err => console.log('Background sync check skipped'))
  //       // }

  //       // Check if payment was just completed
  //       const urlParams = new URLSearchParams(window.location.search)
  //       const paymentSuccess = urlParams.get('payment')
  //       const sessionId = urlParams.get('session_id')

  //       // if (paymentSuccess === 'success' && sessionId) {
  //       //   console.log('🎉 Payment successful! Auto-syncing subscription...')

  //       //   // AUTOMATIC SYNC - No webhook listener needed!
  //       //   try {
  //       //     const syncResponse = await fetch('/api/stripe/sync-subscription', {
  //       //       method: 'POST',
  //       //       headers: { 'Content-Type': 'application/json' },
  //       //       body: JSON.stringify({
  //       //         sessionId,
  //       //         workspaceId: params.workspaceId
  //       //       })
  //       //     })

  //       //     if (syncResponse.ok) {
  //       //       const syncData = await syncResponse.json()
  //       //       console.log('✅ AUTO SYNC SUCCESS!')
  //       //       console.log('   Unlocked Soldiers:', syncData.unlockedSoldiers)
  //       //       console.log('   Database updated automatically ✓')
  //       //       setUnlockedSoldiers(syncData.unlockedSoldiers || [])

  //       //       // Clean URL after successful sync
  //       //       setTimeout(() => {
  //       //         window.history.replaceState({}, '', `/workspace/${params.workspaceId}`)
  //       //       }, 1000)

  //       //       // No need to poll - sync is done!
  //       //       setIsLoading(false)
  //       //       return
  //       //     } else {
  //       //       console.error('⚠️ Sync failed, will retry...')
  //       //     }
  //       //   } catch (syncError) {
  //       //     console.error('❌ Sync error:', syncError)
  //       //   }

  //       //   // Fallback: If sync failed, try polling (for webhook-based updates)
  //       //   console.log('📡 Waiting for webhook or retrying sync...')
  //       //   // Fallback: If sync failed, try polling (for webhook-based updates)
  //       //   console.log('📡 Waiting for webhook or retrying sync...')
  //       //   let attempts = 0
  //       //   const maxAttempts = 10 // Reduced from 15
  //       //   let foundSubscription = false

  //       //   const checkSubscription = async () => {
  //       //     try {
  //       //       // Try sync again every attempt
  //       //       if (attempts > 0 && attempts % 3 === 0) {
  //       //         console.log('🔄 Retrying auto-sync...')
  //       //         const retrySync = await fetch('/api/stripe/sync-subscription', {
  //       //           method: 'POST',
  //       //           headers: { 'Content-Type': 'application/json' },
  //       //           body: JSON.stringify({ sessionId, workspaceId: params.workspaceId })
  //       //         })
  //       //         if (retrySync.ok) {
  //       //           const retryData = await retrySync.json()
  //       //           console.log('✅ Retry sync successful!')
  //       //           setUnlockedSoldiers(retryData.unlockedSoldiers)
  //       //           setTimeout(() => {
  //       //             window.history.replaceState({}, '', `/workspace/${params.workspaceId}`)
  //       //           }, 500)
  //       //           return true
  //       //         }
  //       //       }

  //       //       // Check subscription status
  //       //       const subResponse = await fetch(`/api/workspace/${params.workspaceId}/subscription?t=${Date.now()}`, {
  //       //         cache: 'no-store'
  //       //       })

  //       //       if (subResponse.ok) {
  //       //         const subData = await subResponse.json()
  //       //         if (subData.unlockedSoldiers && subData.unlockedSoldiers.length > 0) {
  //       //           console.log('✅ Subscription found! Soldiers unlocked:', subData.unlockedSoldiers)
  //       //           setUnlockedSoldiers(subData.unlockedSoldiers)
  //       //           foundSubscription = true
  //       //           setTimeout(() => {
  //       //             window.history.replaceState({}, '', `/workspace/${params.workspaceId}`)
  //       //           }, 500)
  //       //           return true
  //       //         }
  //       //       }
  //       //     } catch (err) {
  //       //       console.log('⏳ Attempt', attempts + 1, '/', maxAttempts)
  //       //     }
  //       //     return false
  //       //   }

  //       //   // Check immediately first
  //       //   foundSubscription = await checkSubscription()

  //       //   // If not found, poll every 2 seconds
  //       //   if (!foundSubscription) {
  //       //     const pollInterval = setInterval(async () => {
  //       //       attempts++
  //       //       const found = await checkSubscription()

  //       //       if (found || attempts >= maxAttempts) {
  //       //         clearInterval(pollInterval)
  //       //         if (!found) {
  //       //           console.error('❌ Failed to sync subscription after', maxAttempts, 'attempts')
  //       //           console.error('Please refresh the page or contact support')
  //       //           alert('Payment received! Please refresh the page to see your unlocked soldiers.')
  //       //         }
  //       //       }
  //       //     }, 2000) // Check every 2 seconds instead of 1
  //       //   }
  //       // }

  //       const timestamp = new Date().getTime()
  //       const [workspaceResponse, subscriptionResponse] = await Promise.all([
  //         fetch(`/api/workspace/${params.workspaceId}?t=${timestamp}`, {
  //           cache: 'no-store',
  //           headers: {
  //             'Cache-Control': 'no-cache, no-store, must-revalidate',
  //             Pragma: 'no-cache',
  //           },
  //         }),
  //         fetch(
  //           `/api/workspace/${params.workspaceId}/subscription?t=${timestamp}`,
  //           {
  //             cache: 'no-store',
  //             headers: {
  //               'Cache-Control': 'no-cache, no-store, must-revalidate',
  //               Pragma: 'no-cache',
  //             },
  //           }
  //         ),
  //       ])

  //       const [workspaceData, subscriptionData] = await Promise.all([
  //         workspaceResponse.ok ? workspaceResponse.json() : null,
  //         subscriptionResponse.ok ? subscriptionResponse.json() : null,
  //       ])

  //       if (workspaceData) setWorkspace(workspaceData.workspace)
  //       if (subscriptionData) {
  //         console.log(
  //           '🎖️ Unlocked soldiers from API:',
  //           subscriptionData.unlockedSoldiers
  //         )
  //         setUnlockedSoldiers(subscriptionData.unlockedSoldiers || [])
  //       }
  //     } catch (error) {
  //       // Silent error handling
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }
  //   fetchData()
  // }, [params.userId])

  // Poll subscription status every 30s to reflect cancellations/changes made in dashboard

  // useEffect(() => {
  //   const id = setInterval(() => {
  //     refreshSubscription()
  //   }, 30000)

  //   return () => clearInterval(id)
  // }, [params.workspaceId])

  // Optimized search with useMemo and debouncing
  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') {
      return []
    }

    const query = searchQuery.toLowerCase()
    return allAgents.filter((agent) => {
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.role.toLowerCase().includes(query) ||
        agent.category.toLowerCase().includes(query) ||
        agent.keywords.some((keyword) => keyword.includes(query))
      )
    })
  }, [searchQuery])

  useEffect(() => {
    setShowResults(searchQuery.trim() !== '' && searchResults.length > 0)
  }, [searchQuery, searchResults])

  // Handle clicking outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // const handleAgentSelect = useCallback(
  //   (agent: (typeof allAgents)[0]) => {
  //     const url = agent.comingSoon
  //       ? `/workspace/${params.workspaceId}/chat/${agent.id}?preview=coming-soon`
  //       : `/workspace/${params.workspaceId}/chat/${agent.id}`

  //     if (searchQuery.trim()) {
  //       // If there's a search query, pass it as a prompt
  //       const encodedPrompt = encodeURIComponent(searchQuery)
  //       router.push(
  //         `${url}${agent.comingSoon ? '&' : '?'}prompt=${encodedPrompt}`
  //       )
  //     } else {
  //       router.push(url)
  //     }

  //     setSearchQuery('')
  //     setShowResults(false)
  //   },
  //   [params.workspaceId, searchQuery, router]
  // )

  // const handleSearchSubmit = useCallback(
  //   (e: React.FormEvent) => {
  //     e.preventDefault()
  //     if (searchResults.length > 0) {
  //       handleAgentSelect(searchResults[0])
  //     }
  //   },
  //   [searchResults, handleAgentSelect]
  // )

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setShowResults(false)
  }, [])

  const handleRedirectToChat = async (helperId: string, helperName: string) => {
    const isSoldierValid = unlockedSoldiers.includes(helperId)
    if (hasValidSubscription === 'NOT_FOUND') {
      setSubscriptionDialog(true)
      return
    } else if (hasValidSubscription === 'EXPIRED') {
      setExpiredDialog(true)
      return
    } else if (!isSoldierValid) {
      setSelectedHelper(helperName.toLocaleLowerCase())
      setShowUpgradeDialog(true)
      return
    }

    if (!user?.id) {
      toast.error('User not found. Please log in again.')
      return
    }
    try {
      setIsHelperLoading(true)
      setChoosedHelper(helperId)
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId,
          clerkId: user.id,
        }),
      })
      const { conversationId } = await res.json()
      router.push(
        `/dashboard/${params.userId}/chat/${helperId}/${conversationId}`
      )
    } catch (error) {
      console.log(error)
    } finally {
      setIsHelperLoading(false)
      setChoosedHelper('')
    }
  }

  // Remove extra loading screen for faster page load
  if (isLoading || !isLoaded || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600"></div>
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="main-page-bg relative min-h-screen"
      style={{ margin: 0, paddingTop: '2.5rem', paddingBottom: '2.5rem' }}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 px-3 text-center sm:mb-6 sm:px-4 md:mb-8">
          {/* Search Bar */}
          <div
            className="relative mx-auto max-w-2xl px-3 sm:px-0"
            ref={searchRef}
          >
            <form onSubmit={() => {}}>
              <div
                className="relative rounded-xl border-2 border-[#FFD700] bg-white p-3 shadow-lg md:rounded-2xl md:p-4"
                style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
              >
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search helpers or ask how Soldiers can help you today..."
                  className="w-full border-0 bg-transparent pr-24 text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onFocus={() => searchQuery && setShowResults(true)}
                />
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center space-x-1 md:right-4 md:space-x-2">
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1.5 md:p-2"
                      onClick={clearSearch}
                    >
                      <X className="h-3 w-3 text-gray-400 md:h-4 md:w-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-full bg-blue-500 hover:bg-blue-600"
                    disabled={!searchQuery.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-100 p-3">
                  <div className="text-sm text-gray-500">
                    Found {searchResults.length} helper
                    {searchResults.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="py-2">
                  {searchResults.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => () => {}}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        const video = e.currentTarget.querySelector(
                          'video'
                        ) as HTMLVideoElement
                        if (video) video.play()
                      }}
                      onMouseLeave={(e) => {
                        const video = e.currentTarget.querySelector(
                          'video'
                        ) as HTMLVideoElement
                        if (video) {
                          video.pause()
                          video.currentTime = 0
                        }
                      }}
                    >
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                        <video
                          className="pointer-events-none h-full w-full object-cover"
                          loop
                          muted
                          playsInline
                          onError={(e) => {
                            // Hide video and show gradient background on error
                            const target = e.target as HTMLVideoElement
                            target.style.display = 'none'
                          }}
                        >
                          <source src={agent.avatar} type="video/mp4" />
                        </video>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {agent.name}
                          </h4>
                          {/* {agent.comingSoon && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        )} */}
                        </div>
                        <p className="truncate text-sm text-gray-600">
                          {agent.role}
                        </p>
                        <p className="text-xs text-gray-400">
                          {agent.category}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <Plus className="h-4 w-4 rotate-45" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {showResults &&
              searchResults.length === 0 &&
              searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <h4 className="mb-1 font-medium text-gray-900">
                      No helpers found
                    </h4>
                    <p className="text-sm text-gray-500">
                      Try searching for "social media", "copywriting",
                      "business", or other terms
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Use Cases Section */}
        {hasValidSubscription === 'VALID' && (
          <UseCasesSection userId={params.userId} />
        )}

        {/* Helpers Section */}
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6">
          <div className="mb-4 flex items-center justify-between sm:mb-6 md:mb-6">
            <h2 className="text-lg font-bold text-white sm:text-xl md:text-2xl">
              Soldiers
            </h2>
            <CreateHelperDialog workspaceId={''}>
              <Button
                variant="outline"
                className="border-purple-200 text-sm text-purple-700 hover:bg-purple-50 md:text-base"
              >
                <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Add Helper</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </CreateHelperDialog>
          </div>

          {/* Categorized Helpers */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
            {/* Startup & Business Growth Agents */}
            <div>
              {/* Section Header */}
              <div className="mb-4 flex items-center sm:mb-6">
                {/* <div className="bg-orange-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                <span className="text-xl sm:text-2xl block">🚀</span>
              </div> */}
                {/* <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black line-clamp-2">Startup & Business Growth Agents</h3>
                <p className="text-black text-xs sm:text-sm md:text-base hidden sm:block">Strategy, planning, pitching, and scaling.</p>
              </div> */}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
                {allAgents.map((helper, index) => (
                  <>
                    {index === 5 && (
                      <>
                        {!hasAllSoldiersUnlocked &&
                          hasValidSubscription !== 'NOT_FOUND' && (
                            <div
                              className="relative col-span-2 mb-4 flex flex-row items-center justify-between overflow-hidden rounded-lg border-2 border-[#FFD700] bg-gradient-to-br from-gray-800 to-gray-900 p-4 shadow-lg sm:col-span-3 sm:p-6 md:col-span-4 lg:col-span-5"
                              style={{
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                              }}
                            >
                              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-purple-500/10 blur-3xl sm:h-32 sm:w-32"></div>
                              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl sm:h-32 sm:w-32"></div>

                              {/* Left Side - Text & Button */}
                              <div className="flex flex-col gap-2">
                                <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
                                  Soldiers X
                                </h3>
                                <div className="flex items-center gap-5">
                                  <div className="relative z-10 flex-1 text-left">
                                    <p className="mb-3 text-xs text-white/80 sm:mb-4 sm:text-sm">
                                      Unlock all 5 of your helpers.
                                    </p>

                                    <div className="mb-3 space-y-1 sm:mb-4 sm:space-y-2">
                                      <div className="flex items-center gap-2 text-xs text-white/90 sm:text-sm">
                                        <svg
                                          className="h-3 w-3 text-green-400 sm:h-4 sm:w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        <span>5 Helpers</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-white/90 sm:text-sm">
                                        <svg
                                          className="h-3 w-3 text-green-400 sm:h-4 sm:w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        <span>50+ Power-Ups</span>
                                      </div>
                                    </div>

                                    <Button
                                      onClick={() => {
                                        setSelectedHelper('BUNDLE')
                                        setShowUpgradeDialog(true)
                                      }}
                                      className="rounded-lg border border-yellow-400/50 bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-yellow-500/20 hover:from-yellow-700 hover:to-yellow-600 hover:text-white sm:px-6 sm:text-base"
                                    >
                                      Unlock Soldiers X
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Right Side - Image */}
                              <div className="relative z-10 ml-4 flex-shrink-0 self-end sm:ml-6">
                                <img
                                  src="/icon/5avacard.png"
                                  alt="Soldiers"
                                  className="h-20 w-auto object-contain sm:h-20 md:h-28 lg:h-40"
                                />
                              </div>
                            </div>
                          )}
                      </>
                    )}
                    <SoldierCard
                      key={index}
                      handleRedirectToChat={() =>
                        handleRedirectToChat(helper.id, helper.name)
                      }
                      choosedHelper={choosedHelper}
                      helperId={helper.id as any}
                      helperName={helper.name as any}
                      isHelperLoading={isHelperLoading}
                      setSelectedHelper={setSelectedHelper}
                      role={helper.role as any}
                      setShowUpgradeDialog={() => setShowUpgradeDialog(true)}
                      unlockedSoldiers={unlockedSoldiers}
                      videoUrl={helper.avatar}
                    />
                  </>
                ))}
              </div>
            </div>

            {/* Product & Tech Agents */}

            {/* Marketing & Content Agents */}
            {/* <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black line-clamp-2">Marketing & Content Agents</h3>
                <p className="text-black text-xs sm:text-sm md:text-base hidden sm:block">Traffic, brand, engagement.</p>
              </div>
            </div> */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
              {/* Felix - Email Writer */}
              {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/emmie`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
 <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">  playsInline
                >
                  <source src="/Avatar/Email writer.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#6B5A3F] via-[#AA957F]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Felix</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Email Writer</p>
                </div>
              </Link> */}

              {/* Iris - SEO */}
              {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/seomi`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
     <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">aysInline
                >
                  <source src="/Avatar/SEO.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#363732] via-[#5C5E56]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Iris</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">SEO</p>
                </div>
              </Link> */}

              {/* Ethan - Sales */}
              {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/milli`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
         <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">nline
                >
                  <source src="/Avatar/Sales.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#384458] via-[#5A6B7E]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Ethan</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Sales</p>
                </div>
              </Link> */}
            </div>
            {/* </div> */}

            {/* Operations, Talent & Data Agents */}
            {/* <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black line-clamp-2">Operations, Talent & Data Agents</h3>
                <p className="text-black text-xs sm:text-sm md:text-base hidden sm:block">Backend efficiency, people, data-driven.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* Ava - Virtual Assistant */}
            {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/vizzy`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
             <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">e
                >
                  <source src="/Avatar/Virtual Assistant.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#534E41] via-[#7A7566]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Ava</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Virtual Assistant</p>
                </div>
              </Link> */}

            {/* Theo - Customer Support */}
            {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/cassie`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
              >
<video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">               >
                  <source src="/Avatar/Customer Support.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#585B6C] via-[#8B8E9B]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Theo</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Customer Support</p>
                </div>
              </Link>
              */}

            {/* Nadia - Talent */}
            {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/scouty`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
              >
    <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">           >
                  <source src="/Avatar/Creative.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#BF8A29] via-[#D4A95E]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Nadia</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Talent</p>
                </div>
              </Link>
              */}

            {/* Orion - Data Analyst */}
            {/* <Link 
                href={`/workspace/${params.workspaceId}/chat/dexter`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
              >
        <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">       >
                  <source src="/Avatar/Data.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#4A6D82] via-[#7A96A8]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Orion</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Data Analyst</p>
                </div>
              </Link>
            </div>
          </div> */}

            {/* Personal & Productivity Agents */}
            {/* <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black line-clamp-2">Personal & Productivity Agents</h3>
                <p className="text-black text-xs sm:text-sm md:text-base hidden sm:block">Personal growth, wellness, productivity.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-8">
              <Link 
                href={`/workspace/${params.workspaceId}/chat/gigi`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
              >
            <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">   >
                  <source src="/Avatar/Personal Development.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#655A5E] via-[#958A8E]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Sienna</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Personal Development</p>
                </div>
              </Link>

              <Link 
                href={`/workspace/${params.workspaceId}/chat/productivity-coach`}
                className="rounded-lg shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block group"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) video.play()
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                  if (video) {
                    video.pause()
                    video.currentTime = 0
                  }
                }}
              >
                <video className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="none">
                  <source src="/Avatar/Productivity Coach.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#BBBCB3] via-[#D5D6CE]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-0.5">Kai</h3>
                  <p className="text-white/90 text-xs text-center line-clamp-2">Productivity & Coach</p>
                </div>
              </Link>
            </div>
          </div> */}
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        isOpen={showUpgradeDialog}
        setIsOpen={setShowUpgradeDialog}
      />
      <SubscriptionDialog
        isOpen={subscriptionDialog}
        setIsOpen={setSubscriptionDialog}
      />
      <ExpiredDialog isOpen={expiredDialog} setIsOpen={setExpiredDialog} />
    </div>
  )
}

interface SoldierCardaProps {
  unlockedSoldiers: string[]
  handleRedirectToChat: (helperId: string, helperName: string) => void
  isHelperLoading: boolean
  choosedHelper: string
  setSelectedHelper: (helperName: string) => void
  setShowUpgradeDialog: (show: boolean) => void
  helperId:
    | 'buddy'
    | 'pitch-bot'
    | 'growth-bot'
    | 'dev-bot'
    | 'pm-bot'
    | 'penn'
    | 'soshie'
    | 'seomi'
    | 'milli'
    | 'vizzy'
  helperName:
    | 'Bob'
    | 'Lisa'
    | 'Leo'
    | 'Ada'
    | 'Grace'
    | 'Jasper'
    | 'Zara'
    | 'Iris'
    | 'Ethan'
    | 'Ava'
  role:
    | 'Buzz Builder'
    | 'Investor Deck & Startup Planner'
    | 'Growth & Marketing Planner'
    | 'Profit Maximizer'
    | 'Project Manager'
    | 'Copywriting'
    | 'Social Media'
    | 'SEO'
    | 'Sales'
    | 'Virtual Assistant'
  videoUrl: string
}

const SoldierCard = ({
  unlockedSoldiers,
  handleRedirectToChat,
  isHelperLoading,
  choosedHelper,
  setSelectedHelper,
  helperId,
  helperName,
  role,
  setShowUpgradeDialog,
  videoUrl,
}: SoldierCardaProps) => {
  return (
    <>
      {unlockedSoldiers.includes(helperId) ? (
        <button
          onClick={() => handleRedirectToChat(helperId, helperName)}
          disabled={isHelperLoading && choosedHelper === helperId}
          className="group relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border-2 border-[#FFD700] shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
          onMouseEnter={(e) => {
            const video = e.currentTarget.querySelector(
              'video'
            ) as HTMLVideoElement
            if (video) video.play()
          }}
          onMouseLeave={(e) => {
            const video = e.currentTarget.querySelector(
              'video'
            ) as HTMLVideoElement
            if (video) {
              video.pause()
              video.currentTime = 0
            }
          }}
        >
          {isHelperLoading && choosedHelper === helperId && (
            <>
              <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                <Loader2Icon className="size-5 animate-spin text-neutral-300" />
              </div>
              <div className="absolute left-0 top-0 z-10 h-full w-full bg-black/40" />
            </>
          )}
          <video
            className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
            loop
            muted
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#151A21] via-[#41444B]/90 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1A3A52] via-[#2E5C7A]/90 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative z-10 flex h-full flex-col justify-end p-2 sm:p-3">
            <h3 className="mb-0.5 text-center text-xs font-bold text-white sm:text-sm md:text-base">
              {helperName}
            </h3>
            <p className="line-clamp-2 text-center text-xs text-white/90">
              {role}
            </p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => handleRedirectToChat(helperId, helperName)}
          className="group relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border-2 border-[#FFD700] shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
          onMouseEnter={(e) => {
            const video = e.currentTarget.querySelector(
              'video'
            ) as HTMLVideoElement
            if (video) video.play()
          }}
          onMouseLeave={(e) => {
            const video = e.currentTarget.querySelector(
              'video'
            ) as HTMLVideoElement
            if (video) {
              video.pause()
              video.currentTime = 0
            }
          }}
        >
          {/* Lock Icon */}
          <div className="absolute left-2 top-2 z-20 rounded-full bg-white/90 p-1.5 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-700"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <video
            className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-300"
            loop
            muted
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#151A21] via-[#41444B]/90 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#2C3E50] via-[#4A5F7A]/90 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative z-10 flex h-full flex-col justify-end p-2 sm:p-3">
            <h3 className="mb-0.5 text-center text-xs font-bold text-white sm:text-sm md:text-base">
              {helperName}
            </h3>
            <p className="line-clamp-2 text-center text-xs text-white/90">
              {role}
            </p>
          </div>
        </button>
      )}
    </>
  )
}

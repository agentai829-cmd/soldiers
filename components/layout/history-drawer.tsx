'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getHelperById } from '@/lib/helpers'

interface ConversationSummary {
  id: string
  title: string | null
  helperId: string
  updatedAt: Date
  messageCount: number
}

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
  userId?: string
}

// Get helper data with video avatars
const getHelperData = (helperId: string) => {
  const helperMap: {
    [key: string]: { name: string; avatar: string; role: string }
  } = {
    buddy: {
      name: 'Bob',
      avatar: '/Avatar/Business-Development.mp4',
      role: 'Business Buddy',
    },
    soshie: {
      name: 'Zara',
      avatar: '/Avatar/Social Media.mp4',
      role: 'Social Media Manager',
    },
    emmie: {
      name: 'Felix',
      avatar: '/Avatar/Email writer.mp4',
      role: 'Email Marketing Manager',
    },
    webster: {
      name: 'Aria',
      avatar: '/Avatar/Web-Buider.mp4',
      role: 'Web Developer',
    },
    visionary: {
      name: 'Nova',
      avatar: '/Avatar/Creative.mp4',
      role: 'Creative Visionary',
    },
    voxie: {
      name: 'Echo',
      avatar: '/Avatar/Virtual Assistant.mp4',
      role: 'Voice Assistant',
    },
    builder: {
      name: 'Builder',
      avatar: '/Avatar/Builder-Bot.mp4',
      role: 'Builder Bot',
    },
    copywriter: {
      name: 'Copy Writer',
      avatar: '/Avatar/Copy Writer.mp4',
      role: 'Copy Writer',
    },
    customer: {
      name: 'Customer Support',
      avatar: '/Avatar/Customer Support.mp4',
      role: 'Customer Support',
    },
    data: {
      name: 'Data Analyst',
      avatar: '/Avatar/Data.mp4',
      role: 'Data Analyst',
    },
    dev: { name: 'Dev Bot', avatar: '/Avatar/Dev Bot.mp4', role: 'Developer' },
    growth: {
      name: 'Growth Bot',
      avatar: '/Avatar/Growth Bot.mp4',
      role: 'Growth Specialist',
    },
    personal: {
      name: 'Personal Coach',
      avatar: '/Avatar/Personal Development.mp4',
      role: 'Personal Development',
    },
    pitch: {
      name: 'Pitch Bot',
      avatar: '/Avatar/Pitch Bot.mp4',
      role: 'Pitch Specialist',
    },
    pm: {
      name: 'PM Bot',
      avatar: '/Avatar/PM Bot.mp4',
      role: 'Project Manager',
    },
    productivity: {
      name: 'Productivity Coach',
      avatar: '/Avatar/Productivity Coach.mp4',
      role: 'Productivity Coach',
    },
    sales: {
      name: 'Sales Bot',
      avatar: '/Avatar/Sales.mp4',
      role: 'Sales Specialist',
    },
    seo: { name: 'SEO Bot', avatar: '/Avatar/SEO.mp4', role: 'SEO Specialist' },
    strategy: {
      name: 'Strategy Advisor',
      avatar: '/Avatar/Strategy Advisor.mp4',
      role: 'Strategy Advisor',
    },
  }

  return (
    helperMap[helperId] || {
      name: helperId.charAt(0).toUpperCase() + helperId.slice(1),
      avatar: '/Avatar/Virtual Assistant.mp4', // fallback
      role: 'Assistant',
    }
  )
}

// Helper function to format time ago
const formatTimeAgo = (updatedAt: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(updatedAt).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return `${months}mo ago`
}

export function HistoryDrawer({ open, onClose, userId }: HistoryDrawerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  console.log('🎨 HistoryDrawer rendered:', {
    open,
    userId,
    conversationsLength: conversations.length,
  })
  // Fetch conversations when drawer opens
  useEffect(() => {
    console.log('🔍 History Drawer useEffect triggered:', { open, userId })
    if (open && userId) {
      console.log('📡 Fetching conversations from API...')
      setIsLoading(true)
      fetch(`/api/user/${userId}/conversations`)
        .then((response) => {
          console.log('📡 API Response status:', response.status)
          return response.json()
        })
        .then((data) => {
          console.log('📡 API Response data:', data)
          setConversations(data.conversations || [])
        })
        .catch((error) => {
          console.error('❌ Error fetching conversations:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [open, userId])

  if (!open) {
    console.log('🚫 HistoryDrawer not open, returning null')
    return null
  }

  console.log('✅ HistoryDrawer is open, rendering drawer')

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    (conv.title || 'Untitled Chat')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  // Separate conversations by time periods
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const last7Days = filteredConversations.filter(
    (conv) => new Date(conv.updatedAt) >= sevenDaysAgo
  )
  const last30Days = filteredConversations.filter(
    (conv) =>
      new Date(conv.updatedAt) < sevenDaysAgo &&
      new Date(conv.updatedAt) >= thirtyDaysAgo
  )
  const older = filteredConversations.filter(
    (conv) => new Date(conv.updatedAt) < thirtyDaysAgo
  )

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black bg-opacity-50 md:hidden"
        onClick={onClose}
      />

      {/* History Drawer */}
      <div
        className="fixed bottom-0 left-0 top-0 z-50 flex w-full flex-col overflow-hidden border-r-2 border-yellow-500/50 bg-gradient-to-br from-black to-gray-900 shadow-2xl ring-1 ring-inset ring-yellow-500/30 transition-transform duration-300 ease-in-out md:left-20 md:w-96 md:rounded-br-[32px] md:rounded-tr-[32px]"
        style={{ marginTop: 0, paddingTop: 0 }}
      >
        <div
          className="flex items-center justify-between px-4 pb-2"
          style={{ paddingTop: 0, marginTop: 0 }}
        >
          <p
            className="text-[30px] font-medium leading-[36px] tracking-[-0.9px] text-white"
            style={{ marginTop: '12px' }}
          >
            History
          </p>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 md:hidden"
            aria-label="Close history"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 md:py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-yellow-400 md:h-6 md:w-6"></div>
                <span className="ml-2 text-sm text-white md:text-base">
                  Loading conversations...
                </span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-6 text-center md:py-8">
                <p className="text-sm text-white md:text-base">
                  No conversations found
                </p>
              </div>
            ) : (
              <>
                {/* Last 7 days */}
                {last7Days.length > 0 && (
                  <div>
                    <h4 className="mb-3 px-1 text-sm font-medium text-white">
                      Last 7 days
                    </h4>
                    <div className="flex flex-col gap-2">
                      {last7Days.map((conv) => {
                        const helperData = getHelperData(conv.helperId)
                        return (
                          <Link
                            key={conv.id}
                            href={`/dashboard/${userId}/chat/${conv.helperId}/${conv.id}`}
                            className="group flex min-h-[60px] touch-manipulation items-center gap-3 rounded-lg border-2 border-yellow-500/50 bg-black/60 p-3 transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 active:bg-black/90 md:p-3"
                            onClick={onClose}
                            onMouseEnter={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) video.play()
                            }}
                            onMouseLeave={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) {
                                video.pause()
                                video.currentTime = 0
                              }
                            }}
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-blue-100 md:h-12 md:w-12">
                              <video
                                src={helperData.avatar}
                                className="h-full w-full object-cover"
                                loop
                                muted
                                playsInline
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium leading-tight text-white group-hover:text-gray-200 md:text-base">
                                {conv.title || `Chat with ${helperData.name}`}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-300 md:mt-1 md:text-sm">
                                {formatTimeAgo(conv.updatedAt)}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Last 30 days */}
                {last30Days.length > 0 && (
                  <div>
                    <h4 className="mb-3 px-1 text-sm font-medium text-white">
                      Last 30 days
                    </h4>
                    <div className="flex flex-col gap-2">
                      {last30Days.map((conv) => {
                        const helperData = getHelperData(conv.helperId)
                        return (
                          <Link
                            key={conv.id}
                            href={`/dashboard/${userId}/chat/${conv.helperId}/${conv.id}`}
                            className="group flex min-h-[60px] touch-manipulation items-center gap-3 rounded-lg border-2 border-yellow-500/50 bg-black/60 p-3 transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 active:bg-black/90 md:p-3"
                            onClick={onClose}
                            onMouseEnter={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) video.play()
                            }}
                            onMouseLeave={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) {
                                video.pause()
                                video.currentTime = 0
                              }
                            }}
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-blue-100 md:h-12 md:w-12">
                              <video
                                src={helperData.avatar}
                                className="h-full w-full object-cover"
                                loop
                                muted
                                playsInline
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium leading-tight text-white group-hover:text-gray-200 md:text-base">
                                {conv.title || `Chat with ${helperData.name}`}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-300 md:mt-1 md:text-sm">
                                {formatTimeAgo(conv.updatedAt)}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Older conversations */}
                {older.length > 0 && (
                  <div>
                    <h4 className="mb-3 px-1 text-sm font-medium text-white">
                      Older
                    </h4>
                    <div className="flex flex-col gap-2">
                      {older.map((conv) => {
                        const helperData = getHelperData(conv.helperId)
                        return (
                          <Link
                            key={conv.id}
                            href={`/dashboard/${userId}/chat/${conv.helperId}/${conv.id}`}
                            className="group flex min-h-[60px] touch-manipulation items-center gap-3 rounded-lg border-2 border-yellow-500/50 bg-black/60 p-3 transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 active:bg-black/90 md:p-3"
                            onClick={onClose}
                            onMouseEnter={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) video.play()
                            }}
                            onMouseLeave={(e) => {
                              const video =
                                e.currentTarget.querySelector('video')
                              if (video) {
                                video.pause()
                                video.currentTime = 0
                              }
                            }}
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-blue-100 md:h-12 md:w-12">
                              <video
                                src={helperData.avatar}
                                className="h-full w-full object-cover"
                                loop
                                muted
                                playsInline
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium leading-tight text-white group-hover:text-gray-200 md:text-base">
                                {conv.title || `Chat with ${helperData.name}`}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-300 md:mt-1 md:text-sm">
                                {formatTimeAgo(conv.updatedAt)}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Bottom section with some padding */}
            <div className="h-24"></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HistoryDrawer

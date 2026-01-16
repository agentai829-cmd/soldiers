'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Search, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { getHelperById } from '@/lib/helpers'

interface ConversationSummary {
  id: string
  title: string | null
  helperId: string
  updatedAt: Date
  messageCount: number
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
      avatar: '/Avatar/Virtual Assistant.mp4',
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

export default function HistoryPage() {
  const params = useParams()
  const userId = params.userId as string
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (userId) {
      setIsLoading(true)
      fetch(`/api/user/${userId}/conversations`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Chat Data ', data)
          setConversations(data.conversations || [])
        })
        .catch((error) => {
          console.error('Error fetching conversations:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [userId])

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

  const renderConversationList = (conversations: ConversationSummary[]) => (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const helperData = getHelperData(conv.helperId)
        return (
          <Link
            key={conv.id}
            href={`/dashboard/${userId}/chat/${conv.helperId}/${conv.id}`}
            className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-gray-200 hover:bg-gray-50 active:bg-gray-100"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <video
                src={helperData.avatar}
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                style={{ pointerEvents: 'none' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-medium leading-tight text-black group-hover:text-black">
                {conv.title || `Chat with ${helperData.name}`}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-black">
                <span>{formatTimeAgo(conv.updatedAt)}</span>
                <span>•</span>
                <span>{conv.messageCount} messages</span>
              </div>
              <div className="mt-1 text-xs text-black">{helperData.role}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Mobile Header - Absolutely Fixed */}
      <div className="fixed left-0 right-0 top-0 z-[99999] h-14 border-b border-gray-200 bg-white shadow-lg lg:hidden">
        <div className="flex h-full items-center justify-between px-3">
          {/* Left side - Hamburger + Title */}
          <div className="flex items-center gap-2">
            <button
              className="relative z-[999999] flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-200/50"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <svg
                className="h-4 w-4 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="truncate text-base font-semibold text-black">
              History
            </h1>
          </div>

          {/* Right side - Back button */}
          <Link
            href={`/dashboard/${userId}`}
            className="flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-200/50"
          >
            <ArrowLeft className="h-4 w-4 text-black" />
          </Link>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 hidden border-b border-gray-200 bg-white lg:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/${userId}`}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowLeft className="h-5 w-5 text-black" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white">
                    <Clock className="h-4 w-4 text-black" />
                  </div>
                  <h1 className="text-2xl font-semibold text-black">History</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-black" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-base text-black placeholder-gray-400 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
              <span className="ml-3 text-lg text-black">
                Loading conversations...
              </span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-300 bg-white">
                <Clock className="h-10 w-10 text-black" />
              </div>
              <h3 className="mb-3 text-xl font-medium text-black">
                {searchQuery
                  ? 'No conversations found'
                  : 'No conversation history'}
              </h3>
              <p className="mx-auto max-w-md text-black">
                {searchQuery
                  ? "Try adjusting your search terms to find what you're looking for."
                  : 'Start chatting with your AI helpers to see your conversation history here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Last 7 days */}
              {last7Days.length > 0 && (
                <div>
                  <h2 className="mb-4 px-2 text-lg font-semibold text-black">
                    Last 7 days
                  </h2>
                  {renderConversationList(last7Days)}
                </div>
              )}

              {/* Last 30 days */}
              {last30Days.length > 0 && (
                <div>
                  <h2 className="mb-4 px-2 text-lg font-semibold text-black">
                    Last 30 days
                  </h2>
                  {renderConversationList(last30Days)}
                </div>
              )}

              {/* Older conversations */}
              {older.length > 0 && (
                <div>
                  <h2 className="mb-4 px-2 text-lg font-semibold text-black">
                    Older
                  </h2>
                  {renderConversationList(older)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

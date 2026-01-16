'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Bell, Lightbulb, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHelperById } from '@/lib/helpers'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  metadata?: any
  isRead: boolean
  createdAt: Date
  helperId?: string
  relatedId?: string
}

interface InboxData {
  gettingStarted: NotificationItem[]
  todos: NotificationItem[]
  ideas: NotificationItem[]
  unreadCount: number
}

export default function InboxPage() {
  const params = useParams()
  const userId = params.userId as string
  const [inboxData, setInboxData] = useState<InboxData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInboxData()
  }, [userId])

  const fetchInboxData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/user/${userId}/notifications`)
      if (response.ok) {
        const data = await response.json()
        setInboxData(data)
      }
    } catch (error) {
      console.error('Error fetching inbox data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHelperInfo = (helperId?: string) => {
    const helper = getHelperById(helperId || 'vizzy')
    const name = helper?.name || 'AI Helper'
    const avatar = helper?.avatar

    return {
      name,
      avatar,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '🤖',
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.helperId) {
      let prompt = ''
      const metadata = item.metadata || {}

      if (item.type === 'KNOWLEDGE_SUGGESTION') {
        if (metadata.suggestedAction === 'create_linkedin_post') {
          prompt = `Create a LinkedIn post based on the knowledge I added: "${item.title}". Make it engaging and professional.`
        } else if (metadata.suggestedAction === 'explain_code') {
          prompt = `Help me understand and explain the code/technical content from: "${item.title}"`
        } else if (metadata.suggestedAction === 'analyze_strategy') {
          prompt = `Analyze the business strategy and insights from: "${item.title}". Provide actionable recommendations.`
        } else if (metadata.suggestedAction === 'create_email_campaign') {
          prompt = `Create an email campaign based on the content from: "${item.title}"`
        } else if (metadata.suggestedAction === 'seo_optimization') {
          prompt = `Help me optimize content for SEO based on: "${item.title}"`
        }
      } else if (item.type === 'TODO_ITEM') {
        if (metadata.action === 'review_content') {
          prompt = `Please review and summarize the key insights from the content I added: "${item.title}"`
        }
      } else if (item.type === 'BRAIN_INSIGHT') {
        if (metadata.action === 'analyze_knowledge_base') {
          prompt = `Analyze my knowledge base and provide insights about the patterns, opportunities, and recommendations based on all the content I've added.`
        }
      }

      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            helperId: item.helperId,
            clerkId: userId,
          }),
        })
        const { conversationId } = await res.json()
        // Navigate to helper with contextual prompt
        const url = `/dashboard/${userId}/chat/${item.helperId}/${conversationId}${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`
        window.location.href = url
      } catch (error) {
        console.log(error)
        toast.error('Failed to start conversation. Please try again.')
      }
    }
  }

  return (
    <>
      {/* Mobile Header - Absolutely Fixed */}
      <div className="fixed left-0 right-0 top-0 z-[99999] h-14 border-b border-gray-300/20 bg-[#F6F8F9] shadow-lg lg:hidden">
        <div className="flex h-full items-center justify-between px-3">
          {/* Left side - Hamburger + Title */}
          <div className="flex items-center gap-2">
            <button
              className="relative z-[999999] flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-200/50"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <svg
                className="h-4 w-4 text-gray-800"
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
            <h1 className="truncate text-base font-semibold text-gray-800">
              Inbox
            </h1>
            {inboxData && inboxData.unreadCount > 0 && (
              <span className="flex-shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">
                {inboxData.unreadCount}
              </span>
            )}
          </div>

          {/* Right side - Back button */}
          <Link
            href={`/dashboard/${userId}`}
            className="flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-200/50"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
        </div>
      </div>

      <div className="relative min-h-screen bg-[#F6F8F9]">
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 hidden border-b border-gray-300/20 bg-[#F6F8F9] lg:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/${userId}`}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-200/50"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <Bell className="h-4 w-4 text-purple-600" />
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Inbox
                  </h1>
                  {inboxData && inboxData.unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-1 text-sm font-medium text-white">
                      {inboxData.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-4 py-8 pt-10 sm:px-6 lg:px-8 lg:pt-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-lg text-gray-800">
                Loading notifications...
              </span>
            </div>
          ) : inboxData ? (
            <div className="space-y-8">
              {/* Getting Started */}
              {inboxData.gettingStarted.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-400" />
                    Getting Started
                  </h2>
                  <div className="space-y-4">
                    {inboxData.gettingStarted.map((item) => {
                      const helperInfo = getHelperInfo(item.helperId)
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="cursor-pointer rounded-xl border-2 border-yellow-500/60 bg-black/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-yellow-400/80 hover:shadow-md"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl`}
                            >
                              {helperInfo.avatar ? (
                                <video
                                  src={helperInfo.avatar}
                                  className="h-full w-full rounded-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                helperInfo.icon
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 text-base font-semibold text-white">
                                {item.title}
                              </div>
                              <div className="mb-2 text-sm text-gray-300">
                                {item.message}
                              </div>
                              <div
                                className={`text-sm font-medium text-yellow-400`}
                              >
                                with {helperInfo.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* To-do */}
              {inboxData.todos.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <Image
                      src="/icon/brain-icon.png"
                      alt="Brain"
                      width={20}
                      height={20}
                      className="text-yellow-400"
                    />
                    To-do ({inboxData.todos.length})
                  </h2>
                  <div className="space-y-4">
                    {inboxData.todos.map((item) => {
                      const helperInfo = getHelperInfo(item.helperId)
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="cursor-pointer rounded-xl border-2 border-yellow-500/60 bg-black/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-yellow-400/80 hover:shadow-md"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl`}
                            >
                              {helperInfo.avatar ? (
                                <video
                                  src={helperInfo.avatar}
                                  className="h-full w-full rounded-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                helperInfo.icon
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 text-base font-semibold text-white">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-300">
                                {item.message}
                              </div>
                              <div
                                className={`mt-2 text-sm font-medium text-yellow-400`}
                              >
                                {helperInfo.name}
                              </div>
                              {item.metadata?.contentLength && (
                                <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                                  📄{' '}
                                  {Math.round(
                                    item.metadata.contentLength / 100
                                  ) / 10}
                                  k characters
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ideas */}
              {inboxData.ideas.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Ideas ({inboxData.ideas.length})
                  </h2>
                  <div className="space-y-4">
                    {inboxData.ideas.map((item) => {
                      const helperInfo = getHelperInfo(item.helperId)
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="cursor-pointer rounded-xl border-2 border-yellow-500/60 bg-black/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-yellow-400/80 hover:shadow-md"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl`}
                            >
                              {helperInfo.avatar ? (
                                <video
                                  src={helperInfo.avatar}
                                  className="h-full w-full rounded-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                helperInfo.icon
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 text-base font-semibold text-white">
                                {item.title}
                              </div>
                              <div className="mb-3 text-sm text-gray-300">
                                {item.message}
                              </div>
                              <div
                                className={`text-sm font-medium text-yellow-400`}
                              >
                                {helperInfo.name}
                              </div>
                              {item.metadata?.domain && (
                                <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                                  🌐 {item.metadata.domain}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!inboxData.gettingStarted.length &&
                !inboxData.todos.length &&
                !inboxData.ideas.length && (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <Bell className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mb-3 text-xl font-medium text-white">
                      All caught up!
                    </h3>
                    <p className="mx-auto max-w-md text-gray-300">
                      Add knowledge to Brain AI to get personalized suggestions
                      from your helpers.
                    </p>
                    <div className="mt-6">
                      <Link
                        href={`/dashboard/${userId}/brain`}
                        className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                      >
                        <Image
                          src="/icon/brain-icon.png"
                          alt="Brain"
                          width={16}
                          height={16}
                          className="mr-2"
                        />
                        Go to Brain
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

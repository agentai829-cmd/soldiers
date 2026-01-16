'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Loader2, Bell, Lightbulb, CheckCircle } from 'lucide-react'
import { getHelperById } from '@/lib/helpers'
import { toast } from 'sonner'

interface InboxDrawerProps {
  open: boolean
  onClose: () => void
  userId?: string
}

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

export function InboxDrawer({ open, onClose, userId }: InboxDrawerProps) {
  const [inboxData, setInboxData] = useState<InboxData | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch inbox data when drawer opens
  useEffect(() => {
    if (open && userId && !inboxData) {
      fetchInboxData()
    }
  }, [open, userId])

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
    // Use centralized helper definitions so names stay consistent across the app
    const helper = getHelperById(helperId || 'vizzy')
    const name = helper?.name || 'AI Helper'
    const avatar = helper?.avatar

    return {
      name,
      avatar,
      // Keep simple, predictable classes for badge styling
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '🤖', // Fallback emoji
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.helperId) {
      // Generate contextual prompt based on notification type and metadata
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
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Inbox Drawer */}
      <div
        className="fixed bottom-0 left-0 top-0 z-50 flex w-full flex-col overflow-hidden border-r-2 border-yellow-500/50 bg-gradient-to-br from-black to-gray-900 shadow-2xl ring-1 ring-inset ring-yellow-500/30 transition-transform duration-300 ease-in-out lg:left-20 lg:w-96 lg:rounded-br-[32px] lg:rounded-tr-[32px]"
        style={{ marginTop: 0, paddingTop: 0 }}
      >
        <div
          className="items-center justify-between px-4 pb-2"
          style={{ paddingTop: 0, marginTop: 0 }}
        >
          <div
            className="mb-10 flex items-center justify-between px-2"
            style={{ marginTop: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/40 bg-yellow-500/20">
                <Bell className="h-5 w-5 text-yellow-400" />
              </div>
              <p
                className="text-[30px] font-medium leading-[36px] tracking-[-0.9px] text-white"
                style={{ marginTop: '12px' }}
              >
                Inbox
              </p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Close inbox"
            >
              <svg
                className="h-5 w-5 text-black"
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
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
                <span className="ml-2 text-sm text-white">
                  Loading notifications...
                </span>
              </div>
            ) : inboxData ? (
              <>
                {/* Getting Started */}
                {inboxData.gettingStarted.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-base font-semibold text-white">
                      Getting Started
                    </h4>
                    <div className="space-y-3">
                      {inboxData.gettingStarted.map((item) => {
                        const helperInfo = getHelperInfo(item.helperId)
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="cursor-pointer rounded-2xl border-2 border-yellow-500/50 bg-black/60 p-4 shadow-sm transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 hover:shadow-md"
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
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-lg`}
                              >
                                {helperInfo.avatar ? (
                                  <video
                                    src={helperInfo.avatar}
                                    className="h-full w-full rounded-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                  />
                                ) : (
                                  helperInfo.icon
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 text-base font-semibold text-white">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-300">
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
                    <h4 className="mb-3 text-base font-semibold text-white">
                      To-do
                    </h4>
                    <div className="space-y-3">
                      {inboxData.todos.map((item) => {
                        const helperInfo = getHelperInfo(item.helperId)
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="cursor-pointer rounded-2xl border-2 border-yellow-500/50 bg-black/60 p-4 shadow-sm transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 hover:shadow-md"
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
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-lg`}
                              >
                                {helperInfo.avatar ? (
                                  <video
                                    src={helperInfo.avatar}
                                    className="h-full w-full rounded-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                  />
                                ) : (
                                  helperInfo.icon
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 text-base font-semibold text-white">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {helperInfo.name}
                                </div>
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
                    <h4 className="mb-3 text-base font-semibold text-white">
                      Ideas
                    </h4>
                    <div className="space-y-3">
                      {inboxData.ideas.map((item) => {
                        const helperInfo = getHelperInfo(item.helperId)
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="cursor-pointer rounded-2xl border-2 border-yellow-500/50 bg-black/60 p-4 shadow-sm transition-all hover:scale-[1.02] hover:border-yellow-400/70 hover:bg-black/80 hover:shadow-md"
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
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-12 w-12 ${helperInfo.bgColor} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-lg`}
                              >
                                {helperInfo.avatar ? (
                                  <video
                                    src={helperInfo.avatar}
                                    className="pointer-events-none h-full w-full rounded-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    controls={false}
                                    disablePictureInPicture
                                  />
                                ) : (
                                  helperInfo.icon
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 text-base font-semibold text-white">
                                  {item.title}
                                </div>
                                <div className="mb-1 text-sm text-gray-300">
                                  {item.message}
                                </div>
                                <div className="mt-2 text-xs text-gray-400">
                                  Expiring in 1h
                                </div>
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
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="mb-2 font-medium text-white">
                        All caught up!
                      </h4>
                      <p className="text-sm text-gray-300">
                        Add knowledge to Brain AI to get personalized
                        suggestions from your helpers.
                      </p>
                    </div>
                  )}
              </>
            ) : null}

            {/* Bottom section with some padding */}
            <div className="h-24"></div>

            {/* Bottom section with some padding */}
            <div className="h-24"></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InboxDrawer

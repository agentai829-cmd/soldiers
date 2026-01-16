'use client'

import { Button } from '@/components/ui/button'
import { ChatInput } from '@/components/chat/chat-input'
import { ConversationSettingsModal } from '@/components/helpers/conversation-settings-modal'
import { StreamingMessage } from '@/components/ui/streaming-message'
import { MessageActions } from '@/components/ui/message-actions'
import { useChat } from '@/hooks/useChat'
import { Plus, Loader2Icon } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Thinking Message Component - Memoized for performance
const ThinkingMessage = memo(function ThinkingMessage({
  helperName,
}: {
  helperName: string
}) {
  const [messageIndex, setMessageIndex] = useState(0)

  const thinkingMessages = useMemo(
    () => [
      `${helperName} is thinking...`,
      `Analyzing your question...`,
      `Preparing a helpful response...`,
      `${helperName} is working on this...`,
      `Crafting the perfect answer...`,
      `Almost ready...`,
    ],
    [helperName]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length)
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [thinkingMessages.length])

  return (
    <div className="flex justify-start">
      <div className="max-w-xs rounded-lg bg-transparent px-4 py-3 text-gray-900 lg:max-w-md">
        <div className="flex items-center space-x-3">
          {/* Enhanced animated dots */}
          <div className="flex space-x-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500 [animation-delay:0.3s]"></div>
          </div>
          {/* Rotating message */}
          <span className="text-sm font-medium text-gray-600 transition-all duration-500 ease-in-out">
            {thinkingMessages[messageIndex]}
          </span>
        </div>
      </div>
    </div>
  )
})

interface ChatPageProps {
  conversationId: string
  helperId: string
  userId: string
}

export default function ChatPage({
  conversationId,
  helperId,
  userId,
}: ChatPageProps) {
  const router = useRouter()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helper, setHelper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialHelperLoaded, setInitialHelperLoaded] = useState(false)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [loadingRecents, setLoadingRecents] = useState(true)
  const [showMobileHistory, setShowMobileHistory] = useState(false)
  const [streamingMessageIds, setStreamingMessageIds] = useState<Set<string>>(
    new Set()
  )
  const [streamingErrors, setStreamingErrors] = useState<Set<string>>(new Set())
  const [isMount, setIsMount] = useState(false)

  // Auto-scroll reference
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  const handleUpdateTitle = (conversationId: string, titleChunk: string) => {
    // Update conversation title in recent conversations list
    setRecentConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, title: titleChunk } : conv
      )
    )
  }

  // const handleConversationUpdate = (newConversationId: string) => {
  //   // Update URL with real conversation ID if it was a temporary one - without refresh
  //   if (resolvedParams?.conversationId?.startsWith('new-')) {
  //     // Use window.history.replaceState to update URL without page reload
  //     const newUrl = `/workspace/${resolvedParams.workspaceId}/chat/${resolvedParams.helperId}/${newConversationId}`
  //     window.history.replaceState({}, '', newUrl)
  //     // Update resolved params to match new URL
  //     setResolvedParams({
  //       ...resolvedParams,
  //       conversationId: newConversationId,
  //     })
  //   }
  // }

  const {
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    generateImage,
    setConversationId,
    clearMessages,
    loadConversation,
  } = useChat({
    handleUpdateTitle,
    userId: userId || '',
    helperId: helperId || '',
    // If conversationId starts with "new-", treat as fresh conversation (null)
    conversationId: conversationId,
    onConversationUpdate: () => {}, // handleConversationUpdate,
    onStreamingStart: (messageId) => {
      console.log('Streaming start ', messageId)
      setStreamingMessageIds((prev) => {
        const next = new Set(prev)
        next.add(messageId)
        return next
      })
      // Clear any previous errors for this message
      setStreamingErrors((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    },
    onStreamingEnd: (messageId) => {
      setStreamingMessageIds((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    },
    onStreamingError: (messageId: string, error: string) => {
      // Stop streaming and mark as error
      setStreamingMessageIds((prev) => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
      setStreamingErrors((prev) => {
        const next = new Set(prev)
        next.add(messageId)
        return next
      })
      console.error('Streaming error for message:', messageId, error)
    },
  })

  // Gentle auto-scroll to bottom like ChatGPT
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return

    const container = messagesContainerRef.current
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150

    // Only auto-scroll if user is near bottom, not scrolling, or forced
    if (force || (isNearBottom && !isUserScrolling)) {
      // Use smooth scrolling like ChatGPT
      container.scrollTo({
        top: container.scrollHeight,
        behavior: force ? 'auto' : 'smooth',
      })
    }
  }

  // Detect user scrolling with better sensitivity like ChatGPT
  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const container = messagesContainerRef.current
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100

    if (!isAtBottom) {
      // User scrolled up from bottom
      setIsUserScrolling(true)

      // Clear timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Re-enable auto-scroll after 3 seconds like ChatGPT
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false)
      }, 3000)
    } else {
      // User is at bottom
      setIsUserScrolling(false)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }
  useEffect(() => {
    if(conversationId){
      const validateConversation = async()=>{
        try{
          const res = await fetch(`/api/conversations/${conversationId}/${userId}/${helperId}`)
          if(res.ok){
            const {validatedUser} = await res.json()
            if(validatedUser){
              // Conversation is valid for this user
              console.log('Conversation validated for user')
            }else{
              router.replace(`/dashboard/${userId}`)
            }
          }
        }catch(error){
          console.log(error)
          router.replace(`/dashboard/${userId}`)
        }
      }
      validateConversation()
    }
  },[conversationId])
  // Auto-scroll when messages change - only for new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Only scroll if user is near bottom or if it's a new conversation
      setTimeout(() => scrollToBottom(false), 100) // Gentle scroll
    }
  }, [messages.length])

  // Smooth auto-scroll during streaming - very gentle like ChatGPT
  useEffect(() => {
    if (streamingMessageIds.size > 0) {
      const interval = setInterval(() => {
        if (!isUserScrolling && messagesContainerRef.current) {
          const container = messagesContainerRef.current
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            200

          if (isNearBottom) {
            container.scrollTop = container.scrollHeight
          }
        }
      }, 100) // Very gentle, frequent updates during streaming
      return () => clearInterval(interval)
    }
  }, [streamingMessageIds.size, isUserScrolling])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!messagesContainerRef.current) return

      const container = messagesContainerRef.current

      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault()
        container.scrollTop -= 100
        setIsUserScrolling(true)
      } else if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault()
        container.scrollTop += 100
        setIsUserScrolling(true)
      } else if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault()
        container.scrollTop = 0
        setIsUserScrolling(true)
      } else if (e.key === 'End' && e.ctrlKey) {
        e.preventDefault()
        container.scrollTop = container.scrollHeight
        setIsUserScrolling(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Clean up timeout on unmount & track screen mounting
  useEffect(() => {
    setIsMount(true)
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Handle auto-prompt from URL parameter - removed preview banner logic
  useEffect(() => {
    if (!userId || !helperId || !conversationId || !isMount) return

    const urlParams = new URLSearchParams(window.location.search)
    const prompt = urlParams.get('prompt')

    console.log('🎯 ChatPage: URL params:', { prompt })

    // Only auto-send prompt for new conversations and if we have a prompt
    // Also check that we haven't already sent this prompt
    if (prompt && conversationId) {
      console.log('🎯 ChatPage: Auto-sending prompt:', prompt)

      // Clean up URL FIRST to prevent re-triggering
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('prompt')
      window.history.replaceState({}, '', newUrl.toString())
      setTimeout(() => {
        sendMessage(prompt, [], conversationId)
      }, 1000)
    }
  }, [userId, helperId, conversationId, loading, messages.length, sendMessage, isMount])

  // Get helper data from local hardcoded config
  useEffect(() => {
    if (!userId || !helperId || !conversationId) return

    // Load helper using hardcoded getHelperData function
    try {
      const helperData = getHelperData(helperId)
      console.log('🔍 Retrieved helper data:', helperData)
      console.log('Helper ID ', helperId)

      if (helperData) {
        console.log('✅ Found helper:', helperData.name, 'ID:', helperData.id)
        console.log('🎬 Helper avatar path:', helperData.avatar)
        setHelper(helperData)
        setInitialHelperLoaded(true)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error getting helper:', error)
      setLoading(false)
    }
  }, [userId, helperId, conversationId])

  // Load recent conversations
  useEffect(() => {
    if (!userId || !helperId || !conversationId) return

    const loadRecentConversations = async () => {
      try {
        const response = await fetch(`/api/user/${userId}/conversations`)
        if (response.ok) {
          const data = await response.json()
          // Filter conversations for current helper only
          const helperConversations = data.conversations.filter(
            (conv: any) => conv.helperId === helperId
          )
          setRecentConversations(helperConversations)
        }
      } catch (error) {
        console.error('Error loading recent conversations:', error)
        // Fallback to sample data from attachment
        const sampleHistory =
          helperId === 'emmie'
            ? [
                {
                  id: 1,
                  title: 'what you do',
                  messageCount: 1,
                  timestamp: '10:30 AM',
                },
              ]
            : [
                { id: 1, title: 'hi', messageCount: 1, timestamp: '10:30 AM' },
                {
                  id: 2,
                  title: 'what you do',
                  messageCount: 1,
                  timestamp: '10:31 AM',
                },
                {
                  id: 3,
                  title: "I'll develop AI integration strate...",
                  messageCount: 1,
                  timestamp: '10:32 AM',
                },
                {
                  id: 4,
                  title: 'what difference in you and oth...',
                  messageCount: 1,
                  timestamp: '10:33 AM',
                },
              ]
        setRecentConversations(sampleHistory)
      } finally {
        setLoadingRecents(false)
      }
    }

    loadRecentConversations()
  }, [userId, helperId, conversationId])

  const handleSendMessage = (
    message: string,
    attachments?: any[],
    conversationId?: string
  ) => {
    sendMessage(message, attachments, conversationId)
    // Force scroll to bottom when sending message
    setTimeout(() => scrollToBottom(true), 100)
  }

  const handleGenerateImage = (prompt: string) => {
    generateImage(prompt)
  }

  const handleNewChat = async () => {
    if (!userId || !helperId || !conversationId) return
    // Navigate to helper root URL which will auto-red irect to new conversation

    try {
      setIsCreatingNewChat(true)
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId: helperId,
          clerkId: userId,
        }),
      })
      if (res.ok) {
        const { conversationId } = await res.json()
        router.push(`/dashboard/${userId}/chat/${helperId}/${conversationId}`)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to create new conversation. Please try again.')
    } finally {
      setIsCreatingNewChat(false)
    }
  }

  const handleLoadConversation = (conversation: any) => {
    if (!userId || !helperId || !conversationId) return
    console.log(
      '🔄 ChatPage: Loading conversation:',
      conversation.id,
      'Title:',
      conversation.title
    )
    // Navigate to specific conversation URL
    router.push(`/dashboard/${userId}/chat/${helperId}/${conversation.id}`)
  }

  // Helper data based on helperId - unified blue gradient theme like Marcus
  const getHelperData = (helperId: string) => {
    // Common color scheme for all helpers using Marcus's blue gradient
    const commonColors = {
      color: 'bg-gradient-to-b from-[#0B4A6E] via-[#657D89] to-[#879093]',
      bgColor: 'bg-gradient-to-b from-[#0B4A6E] via-[#657D89] to-[#879093]',
      buttonColor: 'bg-white/10 hover:bg-white/20',
      textColor: 'text-white',
      historyColor: 'bg-transparent hover:bg-white/10',
      accentColor: 'text-white',
    }

    switch (helperId) {
      case 'emmie':
        return {
          id: 'emmie',
          name: 'Felix',
          role: 'Email Writer',
          avatar: '/Avatar/Email writer.mp4',
          color: 'bg-gradient-to-b from-[#6B5A3F] via-[#AA957F] to-[#D4C4A8]',
          bgColor: 'bg-gradient-to-b from-[#6B5A3F] via-[#AA957F] to-[#D4C4A8]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'dexter':
        return {
          id: 'dexter',
          name: 'Orion',
          role: 'Data Analyst',
          avatar: '/Avatar/Data.mp4',
          color: 'bg-gradient-to-b from-[#4A6D82] via-[#7A96A8] to-[#A8BFCE]',
          bgColor: 'bg-gradient-to-b from-[#4A6D82] via-[#7A96A8] to-[#A8BFCE]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'soshie':
        return {
          id: 'soshie',
          name: 'Dave',
          role: 'Local Dominance',
          avatar: '/Avatar/Social Media.mp4',
          color: 'bg-gradient-to-b from-[#5C4A0F] via-[#89510F] to-[#B8860B]',
          bgColor: 'bg-gradient-to-b from-[#5C4A0F] via-[#89510F] to-[#B8860B]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'commet':
        return {
          id: 'commet',
          name: 'Wendy',
          role: 'Customer Whisperer',
          avatar: '/Avatar/Web-Buider.mp4',
          color: 'bg-gradient-to-b from-[#4A5660] via-[#99AAB6] to-[#C5D1DC]',
          bgColor: 'bg-gradient-to-b from-[#4A5660] via-[#99AAB6] to-[#C5D1DC]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'vizzy':
        return {
          id: 'vizzy',
          name: 'Ava',
          role: 'Virtual Assistant',
          avatar: '/Avatar/Virtual Assistant.mp4',
          color: 'bg-gradient-to-b from-[#534E41] via-[#7A7566] to-[#A89D8B]',
          bgColor: 'bg-gradient-to-b from-[#534E41] via-[#7A7566] to-[#A89D8B]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'cassie':
        return {
          id: 'cassie',
          name: 'Theo',
          role: 'Customer Support',
          avatar: '/Avatar/Customer Support.mp4',
          color: 'bg-gradient-to-b from-[#585B6C] via-[#8B8E9B] to-[#C1C3CC]',
          bgColor: 'bg-gradient-to-b from-[#585B6C] via-[#8B8E9B] to-[#C1C3CC]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'penn':
        return {
          id: 'penn',
          name: 'Sarah',
          role: 'Local Celebrity',
          avatar: '/Avatar/Copy Writer.mp4',
          color: 'bg-gradient-to-b from-[#4A4843] via-[#7E7B73] to-[#B5B3AD]',
          bgColor: 'bg-gradient-to-b from-[#4A4843] via-[#7E7B73] to-[#B5B3AD]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'scouty':
        return {
          id: 'scouty',
          name: 'Nadia',
          role: 'Talent',
          avatar: '/Avatar/Creative.mp4',
          color: 'bg-gradient-to-b from-[#BF8A29] via-[#D4A95E] to-[#E8C793]',
          bgColor: 'bg-gradient-to-b from-[#BF8A29] via-[#D4A95E] to-[#E8C793]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'milli':
        return {
          id: 'milli',
          name: 'Ethan',
          role: 'Sales',
          avatar: '/Avatar/Sales.mp4',
          color: 'bg-gradient-to-b from-[#384458] via-[#5A6B7E] to-[#8A9DAF]',
          bgColor: 'bg-gradient-to-b from-[#384458] via-[#5A6B7E] to-[#8A9DAF]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'seomi':
        return {
          id: 'seomi',
          name: 'Iris',
          role: 'SEO',
          avatar: '/Avatar/SEO.mp4',
          color: 'bg-gradient-to-b from-[#363732] via-[#5C5E56] to-[#8A8C82]',
          bgColor: 'bg-gradient-to-b from-[#363732] via-[#5C5E56] to-[#8A8C82]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'gigi':
        return {
          id: 'gigi',
          name: 'Sienna',
          role: 'Personal Development',
          avatar: '/Avatar/Personal Development.mp4',
          color: 'bg-gradient-to-b from-[#655A5E] via-[#958A8E] to-[#C5BABE]',
          bgColor: 'bg-gradient-to-b from-[#655A5E] via-[#958A8E] to-[#C5BABE]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'pitch-bot':
        return {
          id: 'pitch-bot',
          name: 'Lisa',
          role: 'Loyalty',
          avatar: '/Avatar/Pitch Bot.mp4',
          color: 'bg-gradient-to-b from-[#545450] via-[#6C6C67] to-[#8A8A85]',
          bgColor: 'bg-gradient-to-b from-[#545450] via-[#6C6C67] to-[#8A8A85]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'growth-bot':
        return {
          id: 'growth-bot',
          name: 'Ricky',
          role: 'Reputation',
          avatar: '/Avatar/Growth Bot.mp4',
          color: 'bg-gradient-to-b from-[#2E5B5F] via-[#428388] to-[#5EA5AB]',
          bgColor: 'bg-gradient-to-b from-[#2E5B5F] via-[#428388] to-[#5EA5AB]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'strategy-adviser':
        return {
          id: 'strategy-adviser',
          name: 'Emma',
          role: 'Search Engine',
          avatar: '/Avatar/Strategy Advisor.mp4',
          color: 'bg-gradient-to-b from-[#525861] via-[#67767E] to-[#7C8B93]',
          bgColor: 'bg-gradient-to-b from-[#525861] via-[#67767E] to-[#7C8B93]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'builder-bot':
        return {
          id: 'builder-bot',
          name: 'Carl',
          role: 'Competition Crusher',
          avatar: '/Avatar/Builder-Bot.mp4',
          color: 'bg-gradient-to-t from-[#151A21] via-[#41444B] to-[#52575D]',
          bgColor: 'bg-gradient-to-t from-[#151A21] via-[#41444B] to-[#52575D]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'dev-bot':
        return {
          id: 'dev-bot',
          name: 'Paul',
          role: 'Profit Maximizer',
          avatar: '/Avatar/Dev Bot.mp4',
          ...commonColors,
        }
      case 'pm-bot':
        return {
          id: 'pm-bot',
          name: 'Olivia',
          role: 'Offer Fixer',
          avatar: '/Avatar/PM Bot.mp4',
          color: 'bg-gradient-to-b from-[#636360] via-[#7C7C79] to-[#959592]',
          bgColor: 'bg-gradient-to-b from-[#636360] via-[#7C7C79] to-[#959592]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'productivity-coach':
        return {
          id: 'productivity-coach',
          name: 'Kai',
          role: 'Productivity & Coach',
          avatar: '/Avatar/Productivity Coach.mp4',
          color: 'bg-gradient-to-b from-[#BBBCB3] via-[#D5D6CE] to-[#EFEFE9]',
          bgColor: 'bg-gradient-to-b from-[#BBBCB3] via-[#D5D6CE] to-[#EFEFE9]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
      case 'buddy':
      default:
        return {
          id: 'buddy',
          name: 'Bob',
          role: 'Buzz Builder',
          avatar: '/Avatar/Business-Development.mp4',
          color: 'bg-gradient-to-b from-[#031F43] via-[#4A5F7A] to-[#8A9FB1]',
          bgColor: 'bg-gradient-to-b from-[#031F43] via-[#4A5F7A] to-[#8A9FB1]',
          buttonColor: 'bg-white/10 hover:bg-white/20',
          textColor: 'text-white',
          historyColor: 'bg-transparent hover:bg-white/10',
          accentColor: 'text-white',
        }
    }
  }

  // Use hardcoded helper data - no fallback to buddy
  const helperData = helper || (helperId ? getHelperData(helperId) : null)

  // Debug: Log the final helper data being used
  console.log('🎭 Final helperData being used:', {
    name: helperData?.name,
    id: helperData?.id,
    avatar: helperData?.avatar,
    usingLibHelper: !!helper,
    initialLoaded: initialHelperLoaded,
  })

  // Show loading only if params aren't resolved yet - faster loading
  if (!userId || !helperId || !conversationId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <style jsx>{`
            .custom-loader {
              width: 60px;
              aspect-ratio: 1;
              border: 15px solid #ddd;
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
              border: 15px solid #514b82;
              animation: l18 0.8s infinite linear;
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
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If helper data is not found, redirect to workspace home
  if (!helperData) {
    router.push(`/dashboard`)
    return null
  }

  //   const hanleSendDummyTraffic = async () => {
  //     try {
  //       const startTime = performance.now()
  //       console.log('Dummy traffic sended')
  //       const response = await fetch(
  //         `/api/user/${userId}/helpers/${helperId}/run`,
  //         {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //             Accept: 'text/stream-json', // Request streaming
  //           },
  //           body: JSON.stringify({
  //             prompt: 'My name is ali',
  //             conversationId: conversationId, // Include conversationId for continuing conversation
  //             userImageUrl: null,
  //             filename: '',
  //             type: 'image',
  //             id: '',
  //             userId: userId,
  //           }),
  //         }
  //       )
  //       const reader = response.body!.getReader()
  //       const decoder = new TextDecoder()

  //       while (true) {
  //         const { value, done } = await reader.read()
  //         if (done) {
  //           const endTime = performance.now()
  //           const responseTime = endTime - startTime
  //           console.log('Stream complete. Successfully received all data.')
  //           console.log(
  //             `Response time: ${responseTime.toFixed(2)}ms (${(responseTime / 1000).toFixed(2)}s)`
  //           )
  //           break
  //         }
  //       }
  //     } catch (error) {
  //       console.log(error)
  //     }
  //   }

  return (
    <div className="chat-page-background flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* Mobile Header - Only visible on mobile, replaces any hamburger menu */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center border-b border-white/20 bg-transparent px-2 py-3 shadow-sm backdrop-blur-sm lg:hidden">
        {/* Back Arrow - takes to home page */}
        <button
          onClick={() => router.push(`/dashboard/${userId}`)}
          className="mr-2"
          aria-label="Back to home"
        >
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Helper Info - Centered */}
        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="h-8 w-8 overflow-hidden rounded-full">
            <video
              key={`mobile-header-${helperData.id}`}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={helperData.avatar} type="video/mp4" />
            </video>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {helperData.name}
            </h3>
            <p className="text-xs text-blue-600">{helperData.role}</p>
          </div>
        </div>

        {/* History/Watch Icon */}
        <button
          onClick={() => setShowMobileHistory(!showMobileHistory)}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
          aria-label="Toggle chat history"
        >
          <svg
            className="h-5 w-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile History Drawer */}
      {showMobileHistory && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setShowMobileHistory(false)}
        >
          <div
            className={`absolute right-0 top-0 h-full w-80 max-w-[90vw] ${helperData.bgColor} transform text-white shadow-2xl transition-transform`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile History Header */}
            <div className="flex items-center justify-between border-b border-white/20 p-4">
              <h3 className="text-lg font-semibold">Chat History</h3>
              <button
                onClick={() => setShowMobileHistory(false)}
                className="rounded-full p-1 transition-colors hover:bg-white/20"
                aria-label="Close history"
              >
                <svg
                  className="h-5 w-5"
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

            {/* New Chat Button */}
            <div className="border-b border-white/20 p-4">
              <button
                onClick={() => {
                  handleNewChat()
                  setShowMobileHistory(false)
                }}
                className={`w-full ${helperData.buttonColor} flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white shadow-lg`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New chat
              </button>
            </div>

            {/* Chat History List */}
            <div className="scrollbar-hide flex-1 overflow-y-auto p-4">
              <h4
                className={`mb-3 text-sm font-medium uppercase tracking-wide text-white`}
              >
                Recents
              </h4>
              <div className="space-y-2">
                {loadingRecents ? (
                  <div className="animate-pulse rounded-xl bg-white/10 p-3">
                    <div className="h-4 w-3/4 rounded bg-white/20"></div>
                  </div>
                ) : recentConversations.length > 0 ? (
                  recentConversations.map((conversation: any) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        handleLoadConversation(conversation)
                        setShowMobileHistory(false)
                      }}
                      className={`rounded-xl p-3 ${helperData.historyColor} cursor-pointer transition-all duration-200`}
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {conversation.title ||
                          conversation.text ||
                          'New conversation'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div
                    className={`rounded-xl p-3 ${helperData.historyColor} text-center`}
                  >
                    <p className="text-sm text-white/60">
                      No recent conversations
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`hidden lg:flex lg:h-[932px] lg:w-[230px] ${helperData.bgColor} mb-6 mt-2 flex-shrink-0 flex-col rounded-3xl text-white`}
      >
        {/* Helper Profile with Square Video Background */}
        <div className="relative overflow-hidden rounded-t-3xl">
          {/* Square Video Background Area */}
          <div className="relative h-48 w-full sm:h-64 lg:h-80">
            {/* Background Video for avatar - using helperData.avatar */}
            <video
              key={`welcome-bg-${helperData.id}`}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={helperData.avatar} type="video/mp4" />
            </video>
          </div>

          {/* Gradient overlay for better text readability and color blending */}
          <div
            className={`absolute inset-x-0 bottom-0 h-32 ${
              helperData.id === 'seomi'
                ? 'bg-gradient-to-t from-[#363732] via-[#5C5E56]/90 to-transparent'
                : helperData.id === 'emmie'
                  ? 'bg-gradient-to-t from-[#6B5A3F] via-[#AA957F]/90 to-transparent'
                  : helperData.id === 'penn'
                    ? 'bg-gradient-to-t from-[#4A4843] via-[#7E7B73]/90 to-transparent'
                    : helperData.id === 'buddy'
                      ? 'bg-gradient-to-t from-[#031F43] via-[#4A5F7A]/90 to-transparent'
                      : helperData.id === 'growth-bot'
                        ? 'bg-gradient-to-t from-[#2E5B5F] via-[#428388]/90 to-transparent'
                        : helperData.id === 'strategy-adviser'
                          ? 'bg-gradient-to-t from-[#525861] via-[#67767E]/90 to-transparent'
                          : helperData.id === 'builder-bot'
                            ? 'bg-gradient-to-t from-[#151A21] via-[#41444B]/90 to-transparent'
                            : helperData.id === 'pm-bot'
                              ? 'bg-gradient-to-t from-[#636360] via-[#7C7C79]/90 to-transparent'
                              : helperData.id === 'commet'
                                ? 'bg-gradient-to-t from-[#4A5660] via-[#99AAB6]/90 to-transparent'
                                : helperData.id === 'pitch-bot'
                                  ? 'bg-gradient-to-t from-[#545450] via-[#6C6C67]/90 to-transparent'
                                  : helperData.id === 'soshie'
                                    ? 'bg-gradient-to-t from-[#5C4A0F] via-[#89510F]/90 to-transparent'
                                    : helperData.id === 'milli'
                                      ? 'bg-gradient-to-t from-[#384458] via-[#5A6B7E]/90 to-transparent'
                                      : helperData.id === 'vizzy'
                                        ? 'bg-gradient-to-t from-[#534E41] via-[#7A7566]/90 to-transparent'
                                        : helperData.id === 'cassie'
                                          ? 'bg-gradient-to-t from-[#585B6C] via-[#8B8E9B]/90 to-transparent'
                                          : helperData.id === 'scouty'
                                            ? 'bg-gradient-to-t from-[#BF8A29] via-[#D4A95E]/90 to-transparent'
                                            : helperData.id === 'dexter'
                                              ? 'bg-gradient-to-t from-[#4A6D82] via-[#7A96A8]/90 to-transparent'
                                              : helperData.id === 'gigi'
                                                ? 'bg-gradient-to-t from-[#655A5E] via-[#958A8E]/90 to-transparent'
                                                : helperData.id ===
                                                    'productivity-coach'
                                                  ? 'bg-gradient-to-t from-[#BBBCB3] via-[#D5D6CE]/90 to-transparent'
                                                  : 'bg-gradient-to-t from-[#0B4A6E] via-[#657D89]/90 to-transparent'
            }`}
          ></div>

          {/* Settings Icon - Top Right */}
          {/* <button 
            onClick={() => setSettingsOpen(true)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:bg-white/30 z-20"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </button> */}

          {/* Helper name at bottom left */}
          <div className="absolute bottom-2 left-2 z-10 sm:bottom-4 sm:left-4">
            <h2 className="mb-1 text-lg font-bold text-white sm:text-xl lg:text-2xl">
              {helperData.name}
            </h2>
            <p className="text-sm text-white/90 sm:text-base">
              {helperData.role}
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-3 pt-4 sm:px-6 sm:pb-4">
          <Button
            disabled={isCreatingNewChat}
            onClick={handleNewChat}
            className={`w-full ${helperData.buttonColor} rounded-full py-2 text-sm font-medium text-white shadow-lg sm:py-3 sm:text-base`}
          >
            <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {isCreatingNewChat ? 'Creating...' : 'New Chat'}
          </Button>
        </div>

        {/* Chat History */}
        <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
          <h3
            className={`mb-3 text-xs font-medium uppercase tracking-wide text-white sm:mb-4 sm:text-sm`}
          >
            Recents
          </h3>
          <div className="space-y-1 sm:space-y-2">
            {loadingRecents ? (
              <div className="animate-pulse rounded-lg bg-white/10 p-2 sm:rounded-xl sm:p-3">
                <div className="h-4 w-3/4 rounded bg-white/20"></div>
              </div>
            ) : recentConversations.length > 0 ? (
              recentConversations.map((conversation: any) => (
                <div
                  key={conversation.id}
                  onClick={() => handleLoadConversation(conversation)}
                  className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${helperData.historyColor} cursor-pointer transition-all duration-200`}
                >
                  <p className="truncate text-xs font-medium text-white sm:text-sm">
                    {conversation.title ||
                      conversation.text ||
                      'New conversation'}
                  </p>
                </div>
              ))
            ) : (
              <div
                className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${helperData.historyColor} text-center`}
              >
                <p className="text-xs text-white/60 sm:text-sm">
                  No recent conversations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area - with mobile header padding */}
      <div className="chat-page-background relative flex min-w-0 flex-1 flex-col overflow-hidden pt-16 lg:pt-0">
        {/* Subtle overlay for text readability */}
        <div className="chat-overlay absolute inset-0"></div>
        <div className="relative z-10 flex h-full flex-col">
          {/* Chat Messages Area */}
          <div className="flex min-h-0 flex-1 flex-col">
            {messages.length === 0 && !isLoading && !isLoadingHistory ? (
              // Welcome Screen - Centered - Only show when truly empty (no loading state)
              <div className="helper-chat-messages-bg flex flex-1 flex-col items-center justify-center">
                <div className="mx-auto mb-8 max-w-2xl px-4 text-center sm:mb-10 lg:mb-12">
                  <h1 className="mb-3 text-2xl font-bold leading-tight text-white sm:mb-4 sm:text-3xl lg:text-5xl">
                    Hey, it's{' '}
                    <span
                      className={
                        helperData.id === 'seomi'
                          ? 'text-[#5C5E56]'
                          : helperData.id === 'emmie'
                            ? 'text-[#AA957F]'
                            : helperData.id === 'growth-bot'
                              ? 'text-[#4B8E93]'
                              : helperData.id === 'strategy-adviser'
                                ? 'text-[#67767E]'
                                : helperData.id === 'builder-bot'
                                  ? 'text-[#B8860B]'
                                  : helperData.id === 'pm-bot'
                                    ? 'text-[#7C7C79]'
                                    : helperData.id === 'commet'
                                      ? 'text-[#99AAB6]'
                                      : helperData.id === 'penn'
                                        ? 'text-[#7E7B73]'
                                        : helperData.id === 'soshie'
                                          ? 'text-[#89510F]'
                                          : helperData.id === 'milli'
                                            ? 'text-[#5A6B7E]'
                                            : helperData.id === 'vizzy'
                                              ? 'text-[#7A7566]'
                                              : helperData.id === 'scouty'
                                                ? 'text-[#D4A95E]'
                                                : helperData.id === 'dexter'
                                                  ? 'text-[#7A96A8]'
                                                  : helperData.id === 'gigi'
                                                    ? 'text-[#958A8E]'
                                                    : helperData.id ===
                                                        'productivity-coach'
                                                      ? 'text-[#D5D6CE]'
                                                      : helperData.id ===
                                                          'buddy'
                                                        ? 'text-[#4A5F7A]'
                                                        : 'text-[#657D89]'
                      }
                    >
                      {helperData.name}
                    </span>
                    .
                  </h1>
                  <p className="text-lg font-normal text-white/90 sm:text-xl lg:text-2xl">
                    What can I help you with?
                  </p>
                </div>
              </div>
            ) : (
              // Messages - Clean Layout - Always show messages area to prevent white screen
              <div
                ref={messagesContainerRef}
                className="helper-chat-messages-bg scrollbar-hide flex-1 overflow-y-auto scroll-smooth py-4"
                onScroll={handleScroll}
              >
                <div className="mx-auto max-w-4xl space-y-4 px-4">
                  {messages.map((message) => {
                    console.log('New User Message: ', message)
                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Helper Video Avatar for Assistant */}
                        {message.role === 'assistant' && (
                          <div className="mr-3 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md">
                            <video
                              key={`message-avatar-${helperData.id}`}
                              className="h-full w-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            >
                              <source
                                src={helperData.avatar}
                                type="video/mp4"
                              />
                            </video>
                          </div>
                        )}

                        <div className="group">
                          <div
                            className={`max-w-xs rounded-xl px-0 py-0 lg:max-w-lg ${
                              message.role === 'user'
                                ? 'text-white'
                                : 'text-white'
                            }`}
                          >
                            {/* Message Content */}
                            {message.role === 'assistant' ? (
                              <div>
                                {message.content.includes('●●● Thinking...') ? (
                                  <ThinkingMessage
                                    helperName={helperData.name}
                                  />
                                ) : (
                                  <>
                                    <StreamingMessage
                                      content={
                                        message?.imageUrl ? '' : message.content
                                      }
                                      imageUrl={message?.imageUrl || ''}
                                      attachments={message?.attachments || []}
                                      isStreaming={streamingMessageIds.has(
                                        message.id
                                      )}
                                      onComplete={() => {
                                        setStreamingMessageIds((prev) => {
                                          const newSet = new Set(prev)
                                          newSet.delete(message.id)
                                          return newSet
                                        })
                                      }}
                                      messageId={message.id}
                                      onContentUpdate={() => {
                                        // Trigger gentle scroll during streaming
                                        if (
                                          !isUserScrolling &&
                                          messagesContainerRef.current
                                        ) {
                                          const container =
                                            messagesContainerRef.current
                                          const isNearBottom =
                                            container.scrollHeight -
                                              container.scrollTop -
                                              container.clientHeight <
                                            200
                                          if (isNearBottom) {
                                            container.scrollTop =
                                              container.scrollHeight
                                          }
                                        }
                                      }}
                                    />
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="group relative">
                                {message?.attachments &&
                                message?.attachments?.length > 0 ? (
                                  <></>
                                ) : (
                                  <p className="text-sm sm:text-base">
                                    {message.content}
                                  </p>
                                )}

                                {/* User message actions - positioned to not affect layout */}
                                <div className="absolute -right-8 -top-2 z-10">
                                  <MessageActions
                                    messageId={message.id}
                                    isUser={true}
                                    attachments={message?.attachments || []}
                                    content={
                                      message.attachments &&
                                      message?.attachments?.length > 0
                                        ? ''
                                        : message.content
                                    }
                                    onLike={(id) =>
                                      console.log('Liked user message:', id)
                                    }
                                    onDislike={(id) =>
                                      console.log('Disliked user message:', id)
                                    }
                                    onShare={(id) =>
                                      console.log('Shared user message:', id)
                                    }
                                    compact={true}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Helper Suggestion */}
                            {message.helperSuggestion?.suggested && (
                              <div className="mt-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                                      <svg
                                        className="h-4 w-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="mb-1 font-medium text-blue-900">
                                      💡 Better Helper Suggestion
                                    </h4>
                                    <p className="mb-2 text-sm text-blue-800">
                                      For this type of request,{' '}
                                      <strong>
                                        {
                                          message.helperSuggestion
                                            .recommendedHelper.name
                                        }
                                      </strong>{' '}
                                      would be perfect!
                                    </p>
                                    <div className="mb-2 rounded border border-blue-200 bg-white p-2">
                                      <p className="mb-1 text-xs text-gray-600">
                                        Suggested prompt:
                                      </p>
                                      <p className="rounded bg-gray-50 p-2 font-mono text-xs text-gray-800">
                                        {
                                          message.helperSuggestion
                                            .recommendedHelper.suggestedPrompt
                                        }
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        // Copy prompt to clipboard
                                        navigator.clipboard.writeText(
                                          message.helperSuggestion!
                                            .recommendedHelper.suggestedPrompt
                                        )
                                        // Navigate to suggested helper with the suggested prompt
                                        if (
                                          userId &&
                                          helperId &&
                                          conversationId
                                        ) {
                                          const suggestedPrompt =
                                            encodeURIComponent(
                                              message.helperSuggestion!
                                                .recommendedHelper
                                                .suggestedPrompt
                                            )
                                          router.push(
                                            `/dashboard/${userId}/chat/${message.helperSuggestion!.recommendedHelper.id}?prompt=${suggestedPrompt}`
                                          )
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-600"
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                        />
                                      </svg>
                                      Go to{' '}
                                      {
                                        message.helperSuggestion
                                          .recommendedHelper.name
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* File Attachments */}
                            {(message as any).attachments?.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {(message as any).attachments.map(
                                  (attachment: any) => (
                                    <div
                                      key={attachment.id}
                                      className="max-w-40 rounded border bg-gray-50 p-2"
                                    >
                                      {attachment?.type?.includes('image/') &&
                                      !attachment?.type?.includes('svg') ? (
                                        <div className="relative overflow-hidden rounded-lg">
                                          {attachment.isUploading && (
                                            <>
                                              <div className="absolute left-0 top-0 z-20 h-full w-full bg-black/40" />
                                              <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
                                                <Loader2Icon className="size-6 animate-spin text-neutral-300" />
                                              </div>
                                            </>
                                          )}
                                          <img
                                            src={attachment.dataUrl}
                                            alt={attachment.filename}
                                            className="mb-1 h-32 max-w-full rounded object-cover"
                                          />
                                          <p className="text-xs text-gray-600">
                                            {attachment.filename.substring(
                                              0,
                                              20
                                            )}
                                            {attachment.filename.length > 20
                                              ? '...'
                                              : ''}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-600">
                                            {attachment.filename}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            {/* Black underline for assistant messages */}
                            {message.role === 'assistant' && (
                              <div className="mt-3 border-b border-black opacity-10"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Invisible div to scroll to with padding */}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>
            )}
            {/* Chat Input - Centered */}
            <div className="helper-chat-messages-bg flex-shrink-0 px-4 pb-4">
              <div className="mx-auto max-w-4xl">
                <ChatInput
                isMount={isMount}
                  onSendMessage={handleSendMessage}
                  onGenerateImage={handleGenerateImage}
                  disabled={isLoading}
                  conversationId={conversationId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Settings Modal */}
      <ConversationSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        helperName={helperData.name}
      />
    </div>
  )
}

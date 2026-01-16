'use client'

import { Button } from '@/components/ui/button'
import { ChatInput } from '@/components/chat/chat-input'
import { ConversationSettingsModal } from '@/components/helpers/conversation-settings-modal'
import { useChat } from '@/hooks/useChat'
import { 
  Settings, 
  Plus
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface ChatPageProps {
  params: {
    workspaceId: string
    helperId: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helper, setHelper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    workspaceId: params.workspaceId,
    helperId: params.helperId,
  })

  // Fetch helper data
  useEffect(() => {
    const fetchHelper = async () => {
      try {
        const response = await fetch(`/api/workspace/${params.workspaceId}/helpers`)
        if (response.ok) {
          const data = await response.json()
          const helperData = data.helpers.find((h: any) => h.id === params.helperId)
          if (helperData) {
            setHelper(helperData)
          }
        }
      } catch (error) {
        console.error('Error fetching helper:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHelper()
  }, [params.workspaceId, params.helperId])

  const handleSendMessage = (message: string) => {
    sendMessage(message)
  }

  const handleNewChat = () => {
    clearMessages()
  }

  // Get helper data with correct avatars
  const getHelperAvatar = (helperId: string) => {
    const avatarMap = {
      'buddy': '/Avatar/Business-Development.mp4',
      'emmie': '/Avatar/Email writer.mp4',
      'dexter': '/Avatar/Data.mp4',
      'soshie': '/Avatar/Social Media.mp4',
      'commet': '/Avatar/Web-Buider.mp4',
      'vizzy': '/Avatar/Virtual Assistant.mp4',
      'cassie': '/Avatar/Customer Support.mp4',
      'penn': '/Avatar/Copy Writer.mp4',
      'scouty': '/Avatar/Creative.mp4',
      'milli': '/Avatar/Sales.mp4',
      'seomi': '/Avatar/SEO.mp4',
      'gigi': '/Avatar/Personal Development.mp4',
      'pitch-bot': '/Avatar/Pitch Bot.mp4',
      'growth-bot': '/Avatar/Growth Bot.mp4',
      'strategy-adviser': '/Avatar/Strategy Advisor.mp4',
      'builder-bot': '/Avatar/Builder-Bot.mp4',
      'dev-bot': '/Avatar/Dev Bot.mp4',
      'pm-bot': '/Avatar/PM Bot.mp4',
      'productivity-coach': '/Avatar/Productivity Coach.mp4'
    }
    return avatarMap[helperId as keyof typeof avatarMap] || '/Avatar/Business-Development.mp4'
  }

  // Use actual helper data or fallback
  const helperData = helper ? {
    id: helper.id,
    name: helper.name,
    role: helper.description || 'AI Assistant',
    avatar: helper.avatar || getHelperAvatar(params.helperId),
    accentColor: 'text-purple-500'
  } : {
    id: params.helperId,
    name: 'AI Assistant',
    role: 'Helper',
    avatar: getHelperAvatar(params.helperId),
    accentColor: 'text-purple-500'
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Settings Bar */}
      <div className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 p-0 mb-4 hover:bg-gray-200 rounded-lg"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="w-10 h-10 p-0 hover:bg-gray-200 rounded-lg"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100">
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                {/* Helper Avatar Video */}
                <div className="mb-6 sm:mb-8">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover mx-auto shadow-lg"
                  >
                    <source src={helperData.avatar} type="video/mp4" />
                  </video>
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                  Hey, it's <span className={helperData.accentColor}>{helperData.name}</span>.
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 font-normal">What can I help you with?</p>
              </div>
            </div>
          ) : (
            // Messages
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="text-sm sm:text-base">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 shadow-sm max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Chat Input */}
          <div className="pb-4">
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
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
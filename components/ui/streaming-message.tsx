'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageContent } from '@/components/ui/message-content'
import { MessageActions } from '@/components/ui/message-actions'
import Image from 'next/image'

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
  onComplete?: () => void
  showActions?: boolean
  messageId: string
  imageUrl: string
  onContentUpdate?: () => void // Add callback for content updates
  attachments: any[]
}

export function StreamingMessage({
  content,
  isStreaming,
  onComplete,
  showActions = true,
  messageId,
  onContentUpdate,
  imageUrl,
  attachments,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Real streaming effect - content updates in real-time from API
  useEffect(() => {
    if (isStreaming) {
      // During real streaming, content updates come from API
      setDisplayedContent(content)
      setCurrentIndex(content.length)
      setIsComplete(false)

      // Trigger content update for scroll
      onContentUpdate?.()
    } else {
      // Not streaming or streaming finished
      setDisplayedContent(content)
      setCurrentIndex(content.length)
      setIsComplete(true)
    }
  }, [content, isStreaming, onContentUpdate])

  // Handle streaming complete notification
  useEffect(() => {
    if (!isStreaming && content && content.length > 0 && !isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [isStreaming, content, isComplete, onComplete])

  return (
    <div className="group relative">
      <div className="max-w-xs rounded-xl bg-transparent px-0 py-0 text-white lg:max-w-lg">
        {/* Message Content */}
        {imageUrl ? (
          <Image src={imageUrl} alt="Message Image" width={300} height={600} />
        ) : (
          <MessageContent
            content={displayedContent}
            className="prose-sm text-sm text-white sm:text-base"
          />
        )}

        {/* Streaming cursor */}
        {isStreaming && !isComplete && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
        )}

        {/* Message Actions - Only show after streaming is complete */}
        {showActions && isComplete && (
          <div className="-mr-2 mt-2 flex justify-end">
            <MessageActions
              messageId={messageId}
              content={content}
              onLike={(id) => console.log('Liked:', id)}
              onDislike={(id) => console.log('Disliked:', id)}
              onShare={(id) => console.log('Shared:', id)}
              attachments={attachments || []}
              imageUrl={imageUrl}
              isUser={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

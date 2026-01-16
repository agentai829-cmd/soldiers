'use client'

import { useState } from 'react'
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share,
  Check,
  Download,
} from 'lucide-react'

interface MessageActionsProps {
  messageId: string
  content: string
  onLike?: (messageId: string) => void
  onDislike?: (messageId: string) => void
  onShare?: (messageId: string) => void
  compact?: boolean
  isUser?: boolean
  imageUrl?: string
  attachments: any[]
}

export function MessageActions({
  messageId,
  content,
  onLike,
  onDislike,
  onShare,
  isUser = false,
  compact = false,
  imageUrl,
  attachments,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    setDisliked(false) // Clear dislike if liked
    onLike?.(messageId)
  }

  const handleDislike = () => {
    setDisliked(!disliked)
    setLiked(false) // Clear like if disliked
    onDislike?.(messageId)
  }

  const handleShare = () => {
    onShare?.(messageId)

    // Fallback: Copy message with share context
    const shareText = `Check out this AI response:\n\n"${content}"\n\n--- Shared from Soldiers AI Assistant`
    navigator.clipboard.writeText(shareText)
  }

  const handleDownload = async () => {
    if (imageUrl) {
      try {
        // Create a temporary anchor element for download
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `generated-image-${Date.now()}.png`
        link.target = '_blank'

        // Trigger the download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Set downloaded state
        setDownloaded(true)
        setTimeout(() => setDownloaded(false), 3000)
      } catch (error) {
        console.error('Failed to download image:', error)

        // Fallback: Open in new tab
        window.open(imageUrl, '_blank')
      }
    }
  }

  const padding = compact ? 'p-1' : 'p-1.5'
  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4'
  const gap = compact ? 'gap-0.5' : 'gap-1'
  const background = compact
    ? 'bg-white/95 backdrop-blur-sm shadow-md border border-gray-200/50 rounded-lg'
    : ''

  return (
    <div
      className={`flex items-center ${gap} opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${background} ${compact ? 'p-1' : ''}`}
    >
      {/* Download button */}
      {imageUrl && !isUser ? (
        <button
          onClick={handleDownload}
          className={`${padding} rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
          title={downloaded ? 'Downloaded!' : 'Download image'}
        >
          {downloaded ? (
            <Check className={`${iconSize} text-green-600`} />
          ) : (
            <Download
              className={`${iconSize} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
            />
          )}
        </button>
      ) : null}

      {/* Copy Button */}
      {(!attachments || attachments.length === 0) && isUser ? (
        <button
          onClick={handleCopy}
          className={`${padding} rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
          title={copied ? 'Copied!' : 'Copy message'}
        >
          {copied ? (
            <Check className={`${iconSize} text-green-600`} />
          ) : (
            <Copy
              className={`${iconSize} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
            />
          )}
        </button>
      ) : null}

      {/* Like Button */}
      {!isUser ? (
        <button
          onClick={handleLike}
          className={`${padding} rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            liked ? 'bg-green-50 dark:bg-green-900/20' : ''
          }`}
          title={liked ? 'Remove like' : 'Like this response'}
        >
          <ThumbsUp
            className={`${iconSize} ${
              liked
                ? 'fill-green-600 text-green-600'
                : 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500'
            }`}
          />
        </button>
      ) : null}

      {/* Dislike Button */}
      {!isUser ? (
        <button
          onClick={handleDislike}
          className={`${padding} rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            disliked ? 'bg-red-50 dark:bg-red-900/20' : ''
          }`}
          title={disliked ? 'Remove dislike' : 'Dislike this response'}
        >
          <ThumbsDown
            className={`${iconSize} ${
              disliked
                ? 'fill-red-600 text-red-600'
                : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500'
            }`}
          />
        </button>
      ) : null}

      {/* Share Button */}
      {/* {!isUser ? (
        <button
          onClick={handleShare}
          className={`${padding} rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
          title="Share this response"
        >
          <Share
            className={`${iconSize} text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          />
        </button>
      ) : null} */}
    </div>
  )
}

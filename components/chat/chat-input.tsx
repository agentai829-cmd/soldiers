'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Paperclip, Zap, ArrowUp, Image, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage?: (
    message: string,
    attachments?: FileAttachment[],
    conversationId?: string
  ) => void
  onGenerateImage?: (prompt: string) => void
  placeholder?: string
  disabled?: boolean
  conversationId?: string
  isMount: boolean
}

interface FileAttachment {
  id: string
  file: File
  type: 'image' | 'document'
  preview?: string
}

export function ChatInput({
  onSendMessage,
  onGenerateImage,
  placeholder = 'Send a message',
  disabled = false,
  conversationId,
  isMount
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [showImagePrompt, setShowImagePrompt] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input when component mounts
  useEffect(() => {
    if (messageInputRef.current && !disabled) {
      messageInputRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(!isMount) return
    if (
      (message.trim() || attachments.length > 0) &&
      onSendMessage &&
      conversationId
    ) {
      onSendMessage(message.trim(), attachments, conversationId)
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setIsUploading(true)
    setUploadProgress('Preparing files...')

    files.forEach((file, index) => {
      const isImage = file.type.startsWith('image/')
      const attachment: FileAttachment = {
        id: Date.now() + Math.random().toString(),
        file,
        type: isImage ? 'image' : 'document',
      }

      if (isImage) {
        setUploadProgress(`Processing image ${index + 1}/${files.length}...`)
        const reader = new FileReader()
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string
          setAttachments((prev) => [...prev, attachment])

          // If this is the last file, hide upload progress
          if (index === files.length - 1) {
            setTimeout(() => {
              setIsUploading(false)
              setUploadProgress('')
            }, 500)
          }
        }
        reader.readAsDataURL(file)
      } else {
        setUploadProgress(`Processing document ${index + 1}/${files.length}...`)
        setAttachments((prev) => [...prev, attachment])

        // If this is the last file, hide upload progress
        if (index === files.length - 1) {
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress('')
          }, 500)
        }
      }
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleImageGeneration = () => {
    if (imagePrompt.trim() && onGenerateImage) {
      onGenerateImage(imagePrompt.trim())
      setImagePrompt('')
      setShowImagePrompt(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-500"></div>
            <span className="text-sm font-medium text-blue-700">
              {uploadProgress}
            </span>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="group relative">
              {attachment.type === 'image' ? (
                <div className="relative">
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                    aria-label="Remove attachment"
                    title="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="max-w-20 truncate text-sm text-gray-700">
                    {attachment.file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                    aria-label="Remove document"
                    title="Remove document"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Generation Prompt */}
      {/* {showImagePrompt && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Image className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">
              Generate Image
            </span>
            <button
              onClick={() => setShowImagePrompt(false)}
              className="ml-auto text-gray-400 hover:text-gray-600"
              aria-label="Close image generation"
              title="Close image generation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleImageGeneration()
                }
              }}
            />
            <Button
              onClick={handleImageGeneration}
              disabled={!imagePrompt.trim()}
              size="sm"
              className="bg-purple-500 hover:bg-purple-600"
            >
              Generate
            </Button>
          </div>
        </div>
      )} */}

      <form onSubmit={handleSubmit}>
        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-lg sm:rounded-3xl">
          <Input
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-12 w-full rounded-2xl border-0 bg-transparent py-3 pl-8 pr-20 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:min-h-14 sm:rounded-3xl sm:py-4 sm:pl-20 sm:pr-32 sm:text-base lg:min-h-16 lg:py-5 lg:pl-12 lg:pr-40 lg:text-lg"
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload files"
            title="Upload files"
          />

          {/* Left Icons */}
          <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center space-x-1 sm:left-3 sm:space-x-2 lg:left-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg p-1 hover:bg-gray-100 sm:p-1.5 lg:p-2"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              title="Upload file"
            >
              <Paperclip className="h-3 w-3 text-gray-400 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </Button>

            {/* <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg p-1 hover:bg-gray-100 sm:p-1.5 lg:p-2"
              disabled={disabled}
              onClick={() => setShowImagePrompt(!showImagePrompt)}
              title="Generate image"
            >
              <Image className="h-3 w-3 text-purple-500 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            </Button> */}
          </div>

          {/* Right Icons */}
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1 sm:right-3 sm:space-x-2 lg:right-4">
            {/* Mic Icon */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg p-1 hover:bg-gray-100 sm:p-1.5 lg:p-2"
              disabled={disabled}
            >
              <svg
                className="h-3 w-3 text-gray-400 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              size="sm"
              className={cn("ml-0.5 h-8 w-8 rounded-full bg-blue-500 p-0 text-white shadow-lg transition-all duration-200 hover:bg-blue-600 sm:ml-1 sm:h-10 sm:w-10 lg:h-12 lg:w-12", isMount ? "opacity-100 cursor-pointer" : "opacity-50 cursor-not-allowed!")}
              disabled={
                (!message.trim() && attachments.length === 0) || disabled || !isMount
              }
            >
              <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

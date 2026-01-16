'use client'

import { useState, useEffect } from 'react'

interface FileAttachment {
  id: string
  filename: string
  type: 'image' | 'document'
  size: number
  mimeType: string
  dataUrl?: string
  analysis?: string
  content?: string
  openaiFileId?: string // For PDF files uploaded to OpenAI
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: FileAttachment[]
  imageUrl?: string
  isImageGeneration?: boolean
  helperSuggestion?: {
    suggested: boolean
    recommendedHelper: {
      id: string
      name: string
      description: string
      suggestedPrompt: string
    }
    explanation: string
  }
}

interface UseChatProps {
  userId: string
  helperId: string | (() => string)
  conversationId?: string | null
  onConversationUpdate?: (conversationId: string) => void
  handleUpdateTitle?: (conversationId: string, titleChunk: string) => void
  onStreamingStart?: (messageId: string) => void
  onStreamingEnd?: (messageId: string) => void
  onStreamingError?: (messageId: string, error: string) => void
}

export function useChat({
  userId,
  helperId,
  conversationId: initialConversationId,
  onConversationUpdate,
  onStreamingStart,
  onStreamingEnd,
  onStreamingError,
  handleUpdateTitle,
}: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  )
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Update conversationId when initialConversationId prop changes
  // useEffect(() => {
  //   console.log(
  //     '🔄 useChat: conversationId prop changed from',
  //     conversationId,
  //     'to',
  //     initialConversationId
  //   )
  //   setConversationId(initialConversationId || null)
  // }, [initialConversationId])

  // Load conversation history only for existing (real) conversations
  useEffect(() => {
    console.log(
      '🔍 useChat: Loading conversation history for ID:',
      conversationId,
      'userId:',
      userId
    )
    // Only load history if conversationId exists and is NOT a temporary "new-" ID
    if (conversationId && userId && !conversationId.startsWith('new-')) {
      console.log(
        '📚 useChat: Loading messages for conversation:',
        conversationId
      )
      setIsLoadingHistory(true)
      setError(null)
      console.log('Getting prev chat data')
      fetch(`/api/user/${userId}/conversations/${conversationId}/messages`)
        .then((response) => {
          console.log('🌐 useChat: API response status:', response.status)
          if (response.ok) {
            return response.json()
          }
          throw new Error(
            `Failed to load conversation history: ${response.status}`
          )
        })
        .then((data) => {
          console.log('Got prev chat data ', data)
          const historyMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg?.content,
            attachments: msg?.attachments,
            imageUrl: msg?.imageUrl,
            timestamp: new Date(msg.createdAt),
          }))
          console.log(
            '✅ useChat: Processed',
            historyMessages.length,
            'messages'
          )
          setMessages(historyMessages)
        })
        .catch((error) => {
          console.error(
            '❌ useChat: Error loading conversation history:',
            error
          )
          setError('Failed to load conversation history')
          setMessages([]) // Clear messages on error
        })
        .finally(() => {
          setIsLoadingHistory(false)
        })
    } else {
      // Fresh conversation or no conversation ID - start clean
      console.log(
        '🆕 useChat: Starting fresh conversation (no ID or new- prefix)'
      )
      setMessages([])
      setIsLoadingHistory(false)
      setError(null)
    }
  }, [conversationId, userId])

  const sendMessage = async (
    content: string,
    attachments?: any[],
    conversationIdParam?: string
  ) => {
    console.log('🚀 useChat: sendMessage called with content:', content)
    if (!content) {
      alert('Content not found')
      return
    }
    if (!content.trim() && !attachments?.length) return

    const messageId = crypto.randomUUID()

    /* ---------------------------------------------
     * 1. Build optimistic attachments (if any)
     * --------------------------------------------- */
    const optimisticAttachments: FileAttachment[] =
      attachments?.map((att) => ({
        id: crypto.randomUUID(),
        filename: att.file.name,
        type: att.type,
        size: att.file.size,
        mimeType: att.file.type,
        dataUrl: URL.createObjectURL(att.file),
        content: att.content,
        isUploading: true,
      })) ?? []
    let processedAttachments: FileAttachment[] = []

    /* ---------------------------------------------
     * 2. Insert optimistic message INTO STATE
     *    🚨 BEFORE any await
     * --------------------------------------------- */
    const optimisticMessage: Message = {
      id: messageId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: optimisticAttachments,
    }

    // setMessages((prev) => [...prev, optimisticMessage])

    /* ---------------------------------------------
     * 3. Upload attachments (async)
     * --------------------------------------------- */
    if (attachments?.length) {
      try {
        // Add user message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
            dataUrl: optimisticAttachments[0]?.dataUrl,
            attachments: optimisticAttachments,
            isUploading: true,
          },
        ])
        const formData = new FormData()
        attachments.forEach(({ file }) => formData.append('files', file))

        formData.append(
          'prompt',
          'Describe this image in detail, including all visual elements, objects, people, colors, and scene.'
        )

        const uploadResponse = await fetch(`/api/user/${userId}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) throw new Error('Upload failed')

        const { files } = await uploadResponse.json()

        console.log('Files ', files)

        processedAttachments = files.map((file: any) => ({
          id: crypto.randomUUID(),
          filename: file.filename,
          type: file.type,
          size: file.size,
          mimeType: file.mimeType,
          dataUrl: '',
          analysis: file.analysis,
          content: file.content,
          openaiFileId: file.openaiFileId,
          isUploading: false,
        }))

        /* ---------------------------------------------
         * 4. Replace optimistic message IMMUTABLY
         * --------------------------------------------- */
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, attachments: processedAttachments }
              : msg
          )
        )
      } catch (error) {
        console.error('Error processing attachments:', error)
      }
    } else {
      // Add user message to chat
      setMessages((prev) => [...prev, optimisticMessage])
    }

    setIsLoading(true)
    setError(null)

    // // Add thinking message immediately after user message
    const thinkingMessageId = (Date.now() + 0.1).toString()
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      role: 'assistant',
      content: '●●● Thinking...',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, thinkingMessage])

    try {
      const currentHelperId =
        typeof helperId === 'function' ? helperId() : helperId

      // Show processing message for attachments
      if (processedAttachments.length > 0) {
        const processingMessage: Message = {
          id: (Date.now() + 0.5).toString(),
          role: 'assistant',
          content:
            '🔄 Analyzing your attachments and preparing a detailed response...',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, processingMessage])
      }

      // Add realistic delay for better UX (like ChatGPT)
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Construct context from attachments
      let contextFromAttachments = ''
      if (processedAttachments.length > 0) {
        contextFromAttachments = processedAttachments
          .map((att) => {
            if (att.type === 'image' && att.analysis) {
              return `[ATTACHED IMAGE ANALYSIS] The user has attached an image "${att.filename}". Here's what I can see in the image: ${att.analysis}`
            } else if (att.type === 'document' && att.content) {
              // Check if this is a PDF with OpenAI file ID
              if (
                att.mimeType === 'application/pdf' &&
                (att as any).openaiFileId
              ) {
                return `[PDF_FILE_ID:${(att as any).openaiFileId}] The user has attached a PDF document "${att.filename}".`
              }
              return `[ATTACHED DOCUMENT] The user has attached a document "${att.filename}" with the following content: ${att.content}`
            }
            return `[ATTACHED FILE] User attached "${att.filename}" (${att.mimeType})`
          })
          .join('\n\n')
      }

      // Create enhanced prompt with attachment context
      let enhancedPrompt = content.trim()
      if (contextFromAttachments) {
        enhancedPrompt = `${contextFromAttachments}\n\nUser's message: ${content.trim()}\n\nPlease respond to the user's message while taking into account the attached files described above.`
      }

      // Create assistant message placeholder for streaming
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      // Replace thinking message with streaming message
      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (msg) =>
            !msg.content.includes('🔄 Analyzing your attachments') &&
            !msg.content.includes('●●● Thinking...')
        )
        return [...filteredMessages, assistantMessage]
      })

      // Start streaming
      if (onStreamingStart) {
        onStreamingStart(assistantMessageId)
      }

      const resolvedConversationId =
        typeof conversationIdParam === 'string' &&
        conversationIdParam.trim().length > 0
          ? conversationIdParam
          : conversationId

      const response = await fetch(
        `/api/user/${userId}/helpers/${currentHelperId}/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/stream-json', // Request streaming
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            conversationId: resolvedConversationId,
            userImageUrl: processedAttachments[0]?.dataUrl || null,
            filename: processedAttachments[0]?.filename || '',
            type: processedAttachments[0]?.mimeType || 'image',
            id: processedAttachments[0]?.id || '',
            userId,
          }),
        }
      )
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        const clonedResponse = response.clone()
        const data = await clonedResponse.json()

        const { imageUrl } = await response.json()
        if (imageUrl) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === assistantMessageId) {
                return { ...msg, imageUrl: data.imageUrl }
              }
              return msg
            })
          )
          if (onStreamingEnd) {
            onStreamingEnd(assistantMessageId)
          }
          return
        }
      }

      // Update assistant message with image URL
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      let text = ''
      let title = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          if (onStreamingEnd) {
            onStreamingEnd(assistantMessageId)
          }
          break
        }
        const decodedValue = decoder.decode(value)
        const isTitle =
          decodedValue.includes(`${resolvedConversationId}__TITLE_START__`) &&
          decodedValue.includes('__TITLE_END__')
        if (isTitle) {
          const titleArrayFirst = decodedValue.split(
            `${resolvedConversationId}__TITLE_START__`
          )[1]
          const titleArrayLast = titleArrayFirst.split('__TITLE_END__')[0]
          title += titleArrayLast
          handleUpdateTitle && handleUpdateTitle(resolvedConversationId!, title)
        } else {
          text += decoder.decode(value)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: text } : msg
            )
          )
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)

      // Remove thinking message and add error message to chat
      const errorChatMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (msg) => !msg.content.includes('●●● Thinking...')
        )
        return [...filteredMessages, errorChatMessage]
      })

      if (onStreamingError) {
        onStreamingError('error', errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateImage = async (prompt: string) => {
    if (!prompt.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate image: ${prompt}`,
      timestamp: new Date(),
      isImageGeneration: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    // try {
    //   const response = await fetch(
    //     `/api/workspace/${workspaceId}/generate-image`,
    //     {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         prompt: prompt.trim(),
    //         size: '1024x1024',
    //         quality: 'standard',
    //         style: 'vivid',
    //       }),
    //     }
    //   )

    //   if (!response.ok) {
    //     throw new Error('Failed to generate image')
    //   }

    //   const data = await response.json()

    //   const assistantMessage: Message = {
    //     id: (Date.now() + 1).toString(),
    //     role: 'assistant',
    //     content: `Here's the generated image for: "${prompt}"`,
    //     timestamp: new Date(),
    //     imageUrl: data.imageUrl,
    //   }

    //   setMessages((prev) => [...prev, assistantMessage])
    // } catch (err) {
    //   const errorMessage =
    //     err instanceof Error ? err.message : 'Failed to generate image'
    //   setError(errorMessage)

    //   const errorChatMessage: Message = {
    //     id: (Date.now() + 1).toString(),
    //     role: 'assistant',
    //     content: `Sorry, I couldn't generate the image: ${errorMessage}`,
    //     timestamp: new Date(),
    //   }
    //   setMessages((prev) => [...prev, errorChatMessage])
    // } finally {
    //   setIsLoading(false)
    // }
  }

  const clearMessages = () => {
    setMessages([])
    setError(null)
    setConversationId(null) // Reset conversation to start fresh
  }

  const loadConversation = (newConversationId: string) => {
    if (newConversationId === conversationId) return // Already loaded

    setConversationId(newConversationId)
    setIsLoadingHistory(true)
    setError(null)

    fetch(`/api/user/${userId}/conversations/${newConversationId}/messages`)
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Failed to load conversation')
      })
      .then((data) => {
        const historyMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }))
        setMessages(historyMessages)
      })
      .catch((error) => {
        console.error('Error loading conversation:', error)
        setError('Failed to load conversation')
      })
      .finally(() => {
        setIsLoadingHistory(false)
      })
  }

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    generateImage,
    clearMessages,
    setConversationId,
    loadConversation,
    conversationId,
  }
}

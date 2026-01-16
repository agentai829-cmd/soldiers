'use client'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MessageContentProps {
  content: string
  className?: string
}

export function MessageContent({
  content,
  className = '',
}: MessageContentProps) {
  // Add lines only under main section headings
  const processContentWithRedLines = (text: string) => {
    return (
      text
        // Add line after main headings like "Actionable Steps", "Examples / Story", etc.
        .replace(
          /^(#{1,2}\s+[^\n]+)\n/gm,
          '$1\n<div class="w-full h-px bg-white my-4" style="opacity: 0.6;"></div>\n'
        )
        // Add line after bold main headings that are standalone
        .replace(
          /^(\*\*[^*\n:]+\*\*)\s*\n/gm,
          '$1\n<div class="w-full h-px bg-white my-4" style="opacity: 0.6;"></div>\n'
        )
    )
  }

  const processedContent = processContentWithRedLines(content)

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="my-3 text-xl font-bold text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="my-2.5 text-lg font-semibold text-white"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-md my-2 font-medium text-white" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed text-white" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mb-2 ml-4 list-disc" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-2 ml-4 list-decimal" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className?.includes('language-')
            return (
              <code
                className={`rounded bg-gray-200 px-1 py-0.5 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100 ${
                  isInline ? 'inline' : 'my-2 block p-2'
                }`}
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ node, ...props }) => (
            <pre
              className="my-2 overflow-x-auto rounded bg-gray-200 p-2 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 underline dark:text-blue-400"
              {...props}
            />
          ),
          b: ({ node, ...props }) => <b className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          br: ({ node, ...props }) => <br className="my-2" {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

interface Message {
  id: string
  content: string
  isUser?: boolean
}
interface ChatProps {
  messages: Message[]
}
export default function MarcusChat({ messages }: ChatProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([])
  // Auto-scroll to bottoms when messages update
  useEffect(() => {
    setDisplayedMessages(messages)
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])
  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900"
    >
      {displayedMessages.map((msg) => (
        <MessageBubble key={msg.id} content={msg.content} isUser={msg.isUser} />
      ))}
    </div>
  )
}
interface MessageBubbleProps {
  content: string
  isUser?: boolean
}
function MessageBubble({ content, isUser = false }: MessageBubbleProps) {
  const [typedContent, setTypedContent] = useState('')
  const indexRef = useRef(0)
  // Typing animation for Marcus  (not user)
  useEffect(() => {
    if (!isUser) {
      setTypedContent('')
      indexRef.current = 0
      const interval = setInterval(() => {
        if (indexRef.current < content.length) {
          setTypedContent((prev) => prev + content.charAt(indexRef.current))
          indexRef.current += 1
        } else {
          clearInterval(interval)
        }
      }, 10) // Adjust typing speed (ms per char)
      return () => clearInterval(interval)
    } else {
      setTypedContent(content)
    }
  }, [content, isUser])
  return (
    <div
      className={`my-2 flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] whitespace-pre-wrap rounded-lg p-4 font-sans text-sm leading-6 shadow-sm
        ${
          isUser
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }
        `}
      >
        <ReactMarkdown
          children={typedContent}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="my-3 text-xl font-bold" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="my-2.5 text-lg font-semibold" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-md my-2 font-medium" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4 leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="mb-2 ml-4 list-disc" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="mb-2 ml-4 list-decimal" {...props} />
            ),
            code: ({ node, className, children, ...props }: any) => {
              const isInline = !className?.includes('language-')
              return (
                <code
                  className={`rounded bg-gray-200 px-1 py-0.5 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100 ${
                    isInline ? 'inline' : 'my-2 block p-2'
                  }`}
                  {...props}
                >
                  {children}
                </code>
              )
            },
            pre: ({ node, ...props }) => (
              <pre
                className="my-2 overflow-x-auto rounded bg-gray-200 p-2 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                {...props}
              />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-blue-600 underline dark:text-blue-400"
                {...props}
              />
            ),
            b: ({ node, ...props }) => <b className="font-bold" {...props} />,
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            br: ({ node, ...props }) => <br className="my-2" {...props} />,
          }}
        />
      </div>
    </div>
  )
}

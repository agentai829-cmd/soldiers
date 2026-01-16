import React from 'react'
import ChatPage from './conversation-page'

interface PageProps {
  params: {
    userId: string
    helperId: string
    conversationId: string
  }
}

const Page = async ({ params }: PageProps) => {
  const { conversationId, helperId, userId } = params
  return (
    <ChatPage
      conversationId={conversationId}
      helperId={helperId}
      userId={userId}
    />
  )
}

export default Page

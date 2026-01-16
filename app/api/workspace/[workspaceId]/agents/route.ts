import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { hasWorkspaceAccess } from '@/lib/clerk'
import { 
  getTrainedAgents, 
  isAgentTrained, 
  migrateAgentToTrained,
  TRAINED_AGENTS 
} from '@/lib/openai-agents'
import { checkPaymentStatus, getAvailableAgents } from '@/lib/payment-helper'
import { z } from 'zod'

const migrateAgentSchema = z.object({
  agentId: z.string(),
  promptId: z.string().min(1),
  promptVersion: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access (admin only for agent management)
    const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId, 'ADMIN')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get user email for payment check
    const { clerkClient } = await import('@clerk/nextjs/server')
    const user = await clerkClient.users.getUser(userId)
    const emailAddress = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )

    // Check payment status
    const isPaid = emailAddress ? await checkPaymentStatus(emailAddress.emailAddress) : false
    const availableAgentIds = getAvailableAgents(isPaid)

    // Get all agent configurations with training status
    const agentStatus = Object.entries(TRAINED_AGENTS).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      isTrained: isAgentTrained(id),
      promptId: config.promptId || null,
      promptVersion: config.promptVersion || null,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      includeWebSearch: config.includeWebSearch,
      isAvailable: isPaid ? true : availableAgentIds.includes(id), // If paid, all agents available
      isPremium: !availableAgentIds.includes(id), // Mark premium agents
    }))

    return NextResponse.json({
      agents: agentStatus,
      trainedCount: agentStatus.filter(a => a.isTrained).length,
      totalCount: agentStatus.length,
      isPaid,
      availableCount: isPaid ? agentStatus.length : availableAgentIds.length,
    })
  } catch (error) {
    console.error('Error fetching agent status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access (admin only)
    const hasAccess = await hasWorkspaceAccess(resolvedParams.workspaceId, 'ADMIN')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { agentId, promptId, promptVersion } = migrateAgentSchema.parse(body)

    // Migrate agent to trained system
    await migrateAgentToTrained(agentId, promptId, promptVersion)

    return NextResponse.json({
      message: 'Agent migrated successfully',
      agentId,
      promptId,
      promptVersion,
      isTrained: isAgentTrained(agentId),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error migrating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
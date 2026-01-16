// Global type definitions for the Sintra Clone project

export interface WorkerJobData {
  workspaceId: string
}

export interface GeneratePostJobData extends WorkerJobData {
  helperId: string
  prompt: string
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter'
}

export interface PostSocialJobData extends WorkerJobData {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter'
  content: string
  imageUrl?: string
  accountId: string
}

export interface SendEmailJobData extends WorkerJobData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export interface SyncEmailsJobData extends WorkerJobData {
  emailAccountId: string
}

export interface ProcessWebhookJobData {
  provider: string
  event: any
  signature: string
}

export interface HelperExecutionResult {
  response: string
  helper: {
    id: string
    name: string
    description?: string
  }
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface SocialPostResult {
  postId: string
  platform: string
  content: string
  imageUrl?: string
  postedAt: Date
  url: string
}

export interface EmailSendResult {
  messageId: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  sentAt: Date
  status: string
}

export interface EmailSyncResult {
  syncedEmails: number
  newEmails: number
  updatedEmails: number
  syncedAt: Date
}

// Prisma model types for better type safety
export interface UserWithMembers {
  id: string
  clerkId: string
  email: string
  name?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  members: Array<{
    id: string
    role: string
    workspaceId: string
    workspace: {
      id: string
      name: string
      slug: string
      description?: string
      imageUrl?: string
      brandVoice?: string
    }
  }>
}

export interface WorkspaceWithMembers {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  stripeCustomerId?: string
  brandVoice?: string
  createdAt: Date
  updatedAt: Date
  creatorId: string
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name?: string
      email: string
      imageUrl?: string
    }
  }>
  billingSubscription?: {
    id: string
    planId: string
    status: string
    currentPeriodEnd: Date
  }
}

export interface HelperWithWorkspace {
  id: string
  name: string
  description?: string
  prompt: string
  config?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  workspaceId: string
  workspace: {
    id: string
    name: string
    brandVoice?: string
  }
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error types
export interface ApiError {
  message: string
  code?: string
  statusCode: number
}

export interface ValidationError extends ApiError {
  field?: string
  details?: Array<{
    field: string
    message: string
  }>
}

// Social media types
export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'twitter'
export type EmailProvider = 'gmail' | 'outlook' | 'smtp'
export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER'
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE' | 'TRIALING'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
export type AutomationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// Configuration types
export interface OpenAIConfig {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface HelperConfig extends OpenAIConfig {
  systemPrompt?: string
  customInstructions?: string
}

export interface AutomationTrigger {
  type: 'schedule' | 'webhook' | 'email' | 'manual'
  config: {
    cron?: string
    webhookUrl?: string
    emailPattern?: string
  }
}

export interface AutomationAction {
  type: 'generate_post' | 'post_social' | 'send_email' | 'run_helper'
  config: {
    helperId?: string
    platform?: SocialPlatform
    template?: string
    recipients?: string[]
  }
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

// Database result types
export interface EmbeddingSearchResult {
  id: string
  content: string
  title: string
  similarity: number
  metadata?: any
}

export interface KnowledgeDocWithEmbeddings {
  id: string
  title: string
  content: string
  sourceUrl?: string
  sourceType: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
  workspaceId: string
  _count: {
    embeddings: number
  }
}
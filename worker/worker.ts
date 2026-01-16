import { Worker, Job } from 'bullmq'
import { connection } from '../lib/queue'
import { db } from '../lib/db'
import { generateSocialPost, generateEmailResponse } from '../lib/openai'
import { generateUploadSignature } from '../lib/cloudinary'
import type { 
  GeneratePostJobData, 
  PostSocialJobData, 
  SendEmailJobData, 
  SyncEmailsJobData, 
  ProcessWebhookJobData,
  SocialPostResult,
  EmailSendResult,
  EmailSyncResult
} from '../types/index'

console.log('🚀 Starting Soldiers Clone Worker...')

// Generate Post Worker
const generatePostWorker = new Worker(
  'generate-post',
  async (job: Job<GeneratePostJobData>) => {
    console.log(`📝 Processing generate-post job: ${job.id}`)
    
    try {
      const { workspaceId, helperId, prompt, platform } = job.data

      // Get helper details
      const helper = await db.helper.findFirst({
        where: { id: helperId, workspaceId },
        include: { workspace: true },
      })

      if (!helper) {
        throw new Error('Helper not found')
      }

      // Generate social post content
      const result = await generateSocialPost(
        workspaceId,
        platform,
        prompt,
        helper.workspace.brandVoice || undefined
      )

      // Log the job result
      await db.jobLog.create({
        data: {
          type: 'GENERATE_POST',
          workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'COMPLETED',
          result: {
            ...result,
            helperId,
            platform,
          },
        },
      })

      return result
    } catch (error) {
      console.error('Generate post job failed:', error)
      
      // Log the failure
      await db.jobLog.create({
        data: {
          type: 'GENERATE_POST',
          workspaceId: job.data.workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

// Social Post Worker
const postSocialWorker = new Worker(
  'post-social',
  async (job: Job<PostSocialJobData>) => {
    console.log(`📱 Processing post-social job: ${job.id}`)
    
    try {
      const { workspaceId, platform, content, imageUrl, accountId } = job.data

      // Get social account details
      const socialAccount = await db.socialAccount.findFirst({
        where: {
          id: accountId,
          workspaceId,
          provider: platform.toUpperCase() as any,
          isActive: true,
        },
      })

      if (!socialAccount) {
        throw new Error('Social account not found or inactive')
      }

      // Mock posting implementation (replace with actual API calls)
      const result = {
        postId: `mock_${platform}_${Date.now()}`,
        platform,
        content,
        imageUrl,
        postedAt: new Date(),
        url: `https://${platform}.com/post/mock_${Date.now()}`,
      }

      // In production, you would implement actual posting logic here:
      /*
      switch (platform) {
        case 'linkedin':
          result = await postToLinkedIn(socialAccount, content, imageUrl)
          break
        case 'facebook':
          result = await postToFacebook(socialAccount, content, imageUrl)
          break
        case 'instagram':
          result = await postToInstagram(socialAccount, content, imageUrl)
          break
        case 'twitter':
          result = await postToTwitter(socialAccount, content, imageUrl)
          break
      }
      */

      // Log the job result
      await db.jobLog.create({
        data: {
          type: 'POST_SOCIAL',
          workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'COMPLETED',
          result,
        },
      })

      return result
    } catch (error) {
      console.error('Social post job failed:', error)
      
      // Log the failure
      await db.jobLog.create({
        data: {
          type: 'POST_SOCIAL',
          workspaceId: job.data.workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 3,
  }
)

// Send Email Worker
const sendEmailWorker = new Worker(
  'send-email',
  async (job: Job<SendEmailJobData>) => {
    console.log(`📧 Processing send-email job: ${job.id}`)
    
    try {
      const { workspaceId, to, cc, bcc, subject, body, attachments } = job.data

      // Mock email sending implementation (replace with actual email service)
      const result = {
        messageId: `mock_email_${Date.now()}`,
        to,
        cc: cc || [],
        bcc: bcc || [],
        subject,
        sentAt: new Date(),
        status: 'sent',
      }

      // In production, you would implement actual email sending here:
      /*
      const emailAccount = await db.emailAccount.findFirst({
        where: { workspaceId, isActive: true },
      })
      
      if (emailAccount) {
        result = await sendEmailViaProvider(emailAccount, {
          to, cc, bcc, subject, body, attachments
        })
      }
      */

      // Log the job result
      await db.jobLog.create({
        data: {
          type: 'SEND_EMAIL',
          workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'COMPLETED',
          result,
        },
      })

      return result
    } catch (error) {
      console.error('Send email job failed:', error)
      
      // Log the failure
      await db.jobLog.create({
        data: {
          type: 'SEND_EMAIL',
          workspaceId: job.data.workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 10,
  }
)

// Sync Emails Worker
const syncEmailsWorker = new Worker(
  'sync-emails',
  async (job: Job<SyncEmailsJobData>) => {
    console.log(`📬 Processing sync-emails job: ${job.id}`)
    
    try {
      const { workspaceId, emailAccountId } = job.data

      // Get email account details
      const emailAccount = await db.emailAccount.findFirst({
        where: {
          id: emailAccountId,
          workspaceId,
          isActive: true,
        },
      })

      if (!emailAccount) {
        throw new Error('Email account not found or inactive')
      }

      // Mock email sync implementation (replace with actual Gmail API calls)
      const result = {
        syncedEmails: 0,
        newEmails: 0,
        updatedEmails: 0,
        syncedAt: new Date(),
      }

      // In production, you would implement actual email syncing here:
      /*
      const emails = await fetchEmailsFromProvider(emailAccount)
      
      for (const email of emails) {
        const existing = await db.email.findUnique({
          where: { messageId: email.messageId }
        })
        
        if (existing) {
          await db.email.update({
            where: { id: existing.id },
            data: { isRead: email.isRead, labels: email.labels }
          })
          result.updatedEmails++
        } else {
          await db.email.create({
            data: {
              ...email,
              emailAccountId: emailAccount.id,
            }
          })
          result.newEmails++
        }
        result.syncedEmails++
      }
      */

      // Log the job result
      await db.jobLog.create({
        data: {
          type: 'SYNC_EMAILS',
          workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'COMPLETED',
          result,
        },
      })

      return result
    } catch (error) {
      console.error('Sync emails job failed:', error)
      
      // Log the failure
      await db.jobLog.create({
        data: {
          type: 'SYNC_EMAILS',
          workspaceId: job.data.workspaceId,
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 2,
  }
)

// Process Webhook Worker
const processWebhookWorker = new Worker(
  'process-webhook',
  async (job: Job<ProcessWebhookJobData>) => {
    console.log(`🪝 Processing webhook job: ${job.id}`)
    
    try {
      const { provider, event, signature } = job.data

      // Process webhook based on provider
      let result = {}

      switch (provider) {
        case 'stripe':
          // Stripe webhooks are handled directly in the API route
          result = { processed: true, provider: 'stripe' }
          break
        
        case 'facebook':
        case 'linkedin':
        case 'gmail':
          // Handle social media and email webhooks
          result = { processed: true, provider }
          break
        
        default:
          throw new Error(`Unknown webhook provider: ${provider}`)
      }

      // Log the job result
      await db.jobLog.create({
        data: {
          type: 'PROCESS_WEBHOOK',
          workspaceId: 'system', // System-level job
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'COMPLETED',
          result,
        },
      })

      return result
    } catch (error) {
      console.error('Process webhook job failed:', error)
      
      // Log the failure
      await db.jobLog.create({
        data: {
          type: 'PROCESS_WEBHOOK',
          workspaceId: 'system',
          payload: JSON.parse(JSON.stringify(job.data)),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

// Error handling
const workers = [
  generatePostWorker,
  postSocialWorker,
  sendEmailWorker,
  syncEmailsWorker,
  processWebhookWorker,
]

workers.forEach((worker) => {
  worker.on('completed', (job: Job) => {
    console.log(`✅ Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`❌ Job ${job?.id} failed:`, err)
  })

  worker.on('error', (err: Error) => {
    console.error('Worker error:', err)
  })
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down workers...')
  
  await Promise.all(workers.map((worker) => worker.close()))
  
  console.log('👋 Workers shut down successfully')
  process.exit(0)
})

console.log('✅ Workers started successfully!')
console.log('📊 Worker status:')
console.log(`  - Generate Post Worker: Running (concurrency: 5)`)
console.log(`  - Social Post Worker: Running (concurrency: 3)`)
console.log(`  - Send Email Worker: Running (concurrency: 10)`)
console.log(`  - Sync Emails Worker: Running (concurrency: 2)`)
console.log(`  - Process Webhook Worker: Running (concurrency: 5)`)
console.log('🎯 Ready to process jobs!')

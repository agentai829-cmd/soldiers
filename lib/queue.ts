import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import type { 
  GeneratePostJobData,
  PostSocialJobData,
  SendEmailJobData,
  SyncEmailsJobData,
  ProcessWebhookJobData
} from '../types/index'

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
})

// Queue instances
export const generatePostQueue = new Queue('generate-post', { connection })
export const postSocialQueue = new Queue('post-social', { connection })
export const sendEmailQueue = new Queue('send-email', { connection })
export const syncEmailsQueue = new Queue('sync-emails', { connection })
export const processWebhookQueue = new Queue('process-webhook', { connection })

// Job options
const defaultJobOptions = {
  removeOnComplete: 10,
  removeOnFail: 5,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
}

/**
 * Add generate post job to queue
 */
export async function addGeneratePostJob(
  data: GeneratePostJobData,
  options?: { delay?: number; priority?: number }
): Promise<Job<GeneratePostJobData>> {
  return generatePostQueue.add('generate-post', data, {
    ...defaultJobOptions,
    ...options,
  })
}

/**
 * Add social post job to queue
 */
export async function addPostSocialJob(
  data: PostSocialJobData,
  options?: { delay?: number; priority?: number }
): Promise<Job<PostSocialJobData>> {
  return postSocialQueue.add('post-social', data, {
    ...defaultJobOptions,
    ...options,
  })
}

/**
 * Add email sending job to queue
 */
export async function addSendEmailJob(
  data: SendEmailJobData,
  options?: { delay?: number; priority?: number }
): Promise<Job<SendEmailJobData>> {
  return sendEmailQueue.add('send-email', data, {
    ...defaultJobOptions,
    ...options,
  })
}

/**
 * Add email sync job to queue
 */
export async function addSyncEmailsJob(
  data: SyncEmailsJobData,
  options?: { delay?: number; priority?: number }
): Promise<Job<SyncEmailsJobData>> {
  return syncEmailsQueue.add('sync-emails', data, {
    ...defaultJobOptions,
    ...options,
  })
}

/**
 * Add webhook processing job to queue
 */
export async function addProcessWebhookJob(
  data: ProcessWebhookJobData,
  options?: { delay?: number; priority?: number }
): Promise<Job<ProcessWebhookJobData>> {
  return processWebhookQueue.add('process-webhook', data, {
    ...defaultJobOptions,
    ...options,
  })
}

/**
 * Schedule recurring jobs (for automations)
 */
export async function scheduleRecurringJob(
  queueName: string,
  jobName: string,
  data: any,
  cronExpression: string
): Promise<void> {
  const queue = new Queue(queueName, { connection })
  
  await queue.add(jobName, data, {
    repeat: {
      pattern: cronExpression,
    },
    removeOnComplete: 5,
    removeOnFail: 3,
  })
}

/**
 * Cancel scheduled job
 */
export async function cancelScheduledJob(
  queueName: string,
  jobKey: string
): Promise<void> {
  const queue = new Queue(queueName, { connection })
  await queue.removeRepeatableByKey(jobKey)
}

/**
 * Get job status and progress
 */
export async function getJobStatus(
  queueName: string,
  jobId: string
): Promise<{
  status: string
  progress: number
  result?: any
  error?: string
}> {
  const queue = new Queue(queueName, { connection })
  const job = await queue.getJob(jobId)
  
  if (!job) {
    return {
      status: 'not_found',
      progress: 0,
    }
  }

  const state = await job.getState()
  
  return {
    status: state,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    result: job.returnvalue,
    error: job.failedReason,
  }
}

/**
 * Clean up completed and failed jobs
 */
export async function cleanupJobs(): Promise<void> {
  const queues = [
    generatePostQueue,
    postSocialQueue,
    sendEmailQueue,
    syncEmailsQueue,
    processWebhookQueue,
  ]

  for (const queue of queues) {
    await queue.clean(24 * 60 * 60 * 1000, 10, 'completed') // Keep 10 completed jobs for 24h
    await queue.clean(7 * 24 * 60 * 60 * 1000, 5, 'failed') // Keep 5 failed jobs for 7 days
  }
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(queueName: string): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}> {
  const queue = new Queue(queueName, { connection })
  
  return {
    waiting: await queue.getWaiting().then((jobs: any[]) => jobs.length),
    active: await queue.getActive().then((jobs: any[]) => jobs.length),
    completed: await queue.getCompleted().then((jobs: any[]) => jobs.length),
    failed: await queue.getFailed().then((jobs: any[]) => jobs.length),
    delayed: await queue.getDelayed().then((jobs: any[]) => jobs.length),
  }
}

export { connection }
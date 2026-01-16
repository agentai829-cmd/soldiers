import { NextResponse } from 'next/server'
import { autoSyncAllUsers } from '@/lib/auto-sync-service'

/**
 * CRON JOB ENDPOINT
 * Call this endpoint every 5-10 minutes to auto-sync all incomplete payments
 * URL: /api/cron/sync-payments
 */
export async function GET() {
  try {
    // Optional: Add auth token check for security
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🔄 CRON JOB: Running auto-sync...')
    
    const result = await autoSyncAllUsers()
    
    return NextResponse.json({ 
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ CRON JOB ERROR:', error)
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error.message 
    }, { status: 500 })
  }
}

import { db } from '@/lib/db';

/**
 * Check if a user has paid (based on email)
 */
export async function checkPaymentStatus(email: string): Promise<boolean> {
  try {
    const payment = await db.payment.findUnique({
      where: { email },
      select: { status: true },
    });

    return payment?.status === 'succeeded';
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
}

/**
 * Get payment details for a user
 */
export async function getPaymentDetails(email: string) {
  try {
    return await db.payment.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error getting payment details:', error);
    return null;
  }
}

/**
 * Get all agents available based on payment status
 */
export function getAvailableAgents(isPaid: boolean) {
  // Top 5 agents for paid users
  const paidAgents = [
    'buddy',
    'pitch-bot',
    'growth-bot',
    'dev-bot',
    'pm-bot',
  ];

  // Free tier - no agents or limited demo
  const freeAgents: string[] = [];

  return isPaid ? paidAgents : freeAgents;
}

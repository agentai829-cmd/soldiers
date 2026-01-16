import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { checkPaymentStatus } from '@/lib/payment-helper';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await clerkClient.users.getUser(userId);
    
    const emailAddress = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    );

    if (!emailAddress) {
      return NextResponse.json({
        isPaid: false,
        email: null,
      });
    }

    // Check payment status
    const isPaid = await checkPaymentStatus(emailAddress.emailAddress);

    return NextResponse.json({
      isPaid,
      email: emailAddress.emailAddress,
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

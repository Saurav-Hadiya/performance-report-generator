'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function VerificationSent() {
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      
      // Get the email from localStorage (assuming we saved it during signup)
      const email = localStorage.getItem('verification_email');
      
      if (!email) {
        toast.error('Email not found. Please try signing up again.');
        return;
      }
      
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/organization/verify`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Verification email resent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Check Your Email
          </h2>
          <div className="mt-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              We've sent a verification link to your email address.
              <br />
              Please check your inbox and click on the verification link to complete your account setup.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button
              onClick={handleResendEmail}
              className="w-full"
              disabled={resendingEmail}
            >
              {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            <p className="text-sm text-gray-600">
              Already verified?{' '}
              <Link href="/organization/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
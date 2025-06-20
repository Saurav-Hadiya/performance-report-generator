'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Get the parameters from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setVerificationStatus('error');
          setErrorMessage('Verification code is missing.');
          return;
        }
        
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error verifying email:', error);
          setVerificationStatus('error');
          setErrorMessage(error.message || 'Failed to verify email address');
          return;
        }
        
        setVerificationStatus('success');
      } catch (error) {
        console.error('Error in verification process:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred during verification');
      }
    };
    
    verifyEmail();
  }, [searchParams]);
  
  const handleContinue = () => {
    router.push('/organization/signin');
  };

  const handleTryAgain = () => {
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h2>
          
          {verificationStatus === 'loading' && (
            <div className="mt-4">
              <p className="text-gray-600">Verifying your email address...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="mt-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been verified successfully!
              </p>
              <div className="mt-6">
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue to Sign In
                </Button>
              </div>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="mt-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-red-600">
                {errorMessage || 'Failed to verify your email. Please try again.'}
              </p>
              <div className="mt-6">
                <Button 
                  onClick={handleTryAgain}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
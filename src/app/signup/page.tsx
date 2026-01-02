'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, Check, Mail, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { useValidateInvitation } from '@/hooks/employees';
import { Providers } from '@/providers';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') ?? '';
  const name = searchParams.get('name') ?? '';
  const role = searchParams.get('role') ?? '';
  const organization_id = searchParams.get('organization_id') ?? '';
  const department_id = searchParams.get('department_id') ?? null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Redirect immediately if no email or organization_id in URL
  useEffect(() => {
    if (!email || !organization_id) {
      toast.error('Invalid invitation link');
      router.push('/login');
    }
  }, [email, organization_id, router]);

  // Use the useValidateInvitation hook
  const {
    data: inviteResponse,
    isLoading: isValidating,
    isError
  } = useValidateInvitation(email, {
    enabled: !!email && !!organization_id,
    retry: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // Set the password using our API endpoint
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Failed to set password');
      }

      // Update the employee record with the user_id
      if (responseData.data?.userId) {
        // Find the existing employee record
        const { data: employee, error: findError } = await supabase
          .from('employees')
          .select('id, user_id')
          .eq('email', email)
          .eq('organization_id', organization_id)
          .single();

        if (!findError && employee && !employee.user_id) {
          // Update the employee record with the user_id
          await supabase
            .from('employees')
            .update({ user_id: responseData.data.userId })
            .eq('id', employee.id);
        }
      }

      toast.success('Account created successfully! Please login to continue.');
      router.push('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message ?? 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="text-center">
          <div className="relative mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-1">Validating your invitation</h3>
        </div>
      </div>
    );
  }

  // Handle already confirmed accounts
  if (inviteResponse?.error === 'ALREADY_CONFIRMED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-5">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Account Already Active
            </h2>
            <p className="text-gray-600 mb-6">
              You have already accepted this invitation and created your account.
            </p>

            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-colors duration-150"
            >
              <Lock className="mr-2 h-5 w-5" />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle invalid/expired invitations
  if (isError || !inviteResponse?.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50 via-white to-orange-50">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-red-100 overflow-hidden">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-5">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Invalid or Expired Invitation
            </h2>
            <p className="text-gray-600 mb-6">
              {inviteResponse?.message || 'The invitation link is invalid or has expired.'}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Please contact your organization administrator to request a new invitation link.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center"
            >
              Return to Login
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show the signup form (invitation is valid)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-indigo-100 overflow-hidden">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Complete Your Account
            </h2>
            <p className="mt-2 text-gray-600">
              Set your password to access the system
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-indigo-900 mb-2">Your Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-indigo-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-indigo-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">{email}</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{role}</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-indigo-500" />
                  Password
                </Label>
                <div className="relative">
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Check className="h-4 w-4 mr-2 text-indigo-500" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${confirmPassword && password !== confirmPassword ? 'border-red-500' :
                      confirmPassword && password === confirmPassword ? 'border-green-500' : ''
                      }`}
                  />
                  {confirmPassword && (
                    <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none z-10">
                      {password === confirmPassword ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                </span>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Setting Up Your Account...
                  </>
                ) : 'Set Password & Complete Setup'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeSignup() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </Providers>
  );
} 

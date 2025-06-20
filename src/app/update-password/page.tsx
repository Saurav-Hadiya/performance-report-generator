'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();
  
  // Check if user is authenticated via reset token
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and not accessing via reset password flow, redirect to login
      if (!session && !window.location.hash.includes('type=recovery')) {
        toast.error('Invalid or expired password reset link');
        router.push('/login');
      }
    };
    
    checkSession();
  }, [router, supabase]);
  
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
    
    setIsLoading(true);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast.success('Password updated successfully');
      
      // Determine where to redirect based on user role
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;
      
      if (role === 'organization') {
        router.push('/organization/signin');
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      setError(error.message ?? 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Update Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
} 
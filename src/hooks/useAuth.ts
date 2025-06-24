import { useAuth as useAuthContext } from '@/providers/AuthProvider';
import { useSignIn, useSignOut, useSignUp } from './auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Custom hook that combines authentication state and methods
 * for a simplified auth interface throughout the application
 */
export const useAuth = () => {
  const authContext = useAuthContext();
  const router = useRouter();
  
  const signIn = useSignIn({
    onSuccess: (data) => {
      if (data.user) {
        toast.success(data.message ?? 'Successfully signed in');
        
        // For organization users, check if details are completed 
        if (data.user.user_metadata?.role === 'organization') {
          if (data.detailsCompleted === false) {
            // Redirect to details page if not completed
            router.replace('/organization/details');
          } else {
            // Otherwise go to dashboard 
            router.replace('/organization/dashboard');
          }
        } else {
          // For non-organization users (employees etc.)
          router.replace('/');
        }
      } else if (data.emailVerificationRequired) {
        // Handle unverified email during sign in
        toast.error(data.error);
      } else if (data.error) {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sign in');
    },
  });
  
  const signUp = useSignUp({
    onSuccess: (data) => {
      if (data.needsEmailConfirmation) {
        toast.success('Verification email sent. Please check your inbox to confirm your account before signing in.');
      } else if (data.user) {
        // Normal flow without email verification
        toast.success(data.message ?? 'Account created successfully');
        router.push('/organization/details');
      } else if (data.error) {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
  
  const logout = useSignOut({
    onSuccess: (data) => {
      if (data.message) {
        toast.success(data.message);
        router.replace('/organization/signin');
      } else if (data.error) {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to log out');
    },
  });
  
  return {
    // Auth state
    user: authContext.user,
    isLoading: authContext.isLoading,
    isAuthenticated: authContext.isAuthenticated,
    
    // Auth methods
    signIn: signIn.mutate,
    signUp: signUp.mutate,
    logout: logout.mutate,
    
    // Loading states
    isSigningIn: signIn.isPending,
    isSigningUp: signUp.isPending,
    isLoggingOut: logout.isPending,
  };
}; 
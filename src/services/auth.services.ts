import { User } from '@supabase/supabase-js';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name?: string;
  email: string;
  password: string;
  role?: string;
  companyAddress?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User | null;
  message?: string;
  error?: string;
}

// Sign in with email and password
export const signInWithEmailPassword = async (credentials: SignInCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to sign in' };
    }
    
    return { 
      user: data.user,
      message: data.message
    };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign in' };
  }
};

// Sign up with email and password
export const signUpWithEmailPassword = async (signUpData: SignUpData): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signUpData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to sign up' };
    }
    
    return { 
      user: data.user,
      message: data.message
    };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to sign up' };
  }
};

// Sign out
export const signOut = async (): Promise<{ message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to sign out' };
    }
    
    return { message: data.message };
  } catch (error: any) {
    return { error: error.message || 'Failed to sign out' };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: User | null; error?: string }> => {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'GET',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to get user' };
    }
    
    return { user: data.user };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to get user' };
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to reset password' };
    }
    
    return { message: data.message };
  } catch (error: any) {
    return { error: error.message || 'Failed to reset password' };
  }
};

// Update password
export const updatePassword = async (password: string): Promise<{ message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to update password' };
    }
    
    return { message: data.message };
  } catch (error: any) {
    return { error: error.message || 'Failed to update password' };
  }
}; 
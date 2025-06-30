'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface SigninFormData {
  email: string
  password: string
}

export default function OrganizationSignin() {
  const { signIn, isSigningIn } = useAuth()
  const [formData, setFormData] = useState<SigninFormData>({
    email: '',
    password: '',
  })
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (verificationRequired) setVerificationRequired(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    signIn(formData)
  }

  // Check localStorage for verification status
  useEffect(() => {
    const checkVerificationStatus = () => {
      const verificationRequired = localStorage.getItem('signin_email_verification_required')
      const email = localStorage.getItem('signin_email')
      
      if (verificationRequired === 'true' && email) {
        setVerificationRequired(true)
        setVerificationEmail(email)
        // Update form email to match
        setFormData(prev => ({ ...prev, email }))
        // Clear after using
        localStorage.removeItem('signin_email_verification_required')
        localStorage.removeItem('signin_email')
      }
    }
    
    checkVerificationStatus()
    
    // Set up interval to check for changes
    const intervalId = setInterval(checkVerificationStatus, 500)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Organization Sign In
          </h1>
          <p className="text-gray-600 mb-4">
            Access your organization dashboard
          </p>
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/organization/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              Create your organization
            </Link>
          </p>
        </div>

        {/* Verification Alert */}
        {verificationRequired && (
          <div className="mb-6">
            <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-amber-800 font-semibold">Email Verification Required</AlertTitle>
                  <AlertDescription className="text-amber-700 mt-1">
                    <p className="text-sm">
                      Please check your inbox for a verification email. We've sent a new verification link to{' '}
                      <span className="font-medium">{verificationEmail}</span>.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors"
                      onClick={() => setVerificationRequired(false)}
                    >
                      I've verified my email
                    </Button>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  placeholder="your@organization.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link 
                  href="/reset-password" 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        {/* Footer Section */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-500">
                Employee Login
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 font-medium transition-colors group"
            >
              <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign in as Employee</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

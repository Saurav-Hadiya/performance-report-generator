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
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your Organization
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/organization/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new organization account
            </Link>
          </p>
        </div>

        {verificationRequired && (
          <Alert className="bg-amber-50 border-amber-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <AlertTitle className="text-amber-800">Email not verified</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please check your inbox for a verification email. A new verification link has been sent to {verificationEmail}.
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 w-full"
                onClick={() => setVerificationRequired(false)}
              >
                I've verified my email
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/reset-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSigningIn}
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}

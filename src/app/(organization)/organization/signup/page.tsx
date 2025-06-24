'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/hooks'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface SignupFormData {
    email: string
    password: string
    confirmPassword: string
}

export default function OrganizationSignup() {
    const { signUp, isSigningUp } = useAuth()
    const [formData, setFormData] = useState<SignupFormData>({
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [verificationSent, setVerificationSent] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        
        // Call the signUp mutation with the form data
        const { email, password } = formData
        signUp({ 
            email, 
            password,
            role: 'organization'
        }, {
            onSuccess: (data) => {
                if (data.needsEmailConfirmation) {
                    setVerificationSent(true)
                }
            }
        })
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create Organization Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{' '}
                        <Link href="/organization/signin" className="font-medium text-blue-600 hover:text-blue-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                {verificationSent ? (
                    <Alert className="bg-green-50 border-green-200">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-3 text-green-500 inline-flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                    <path d="M22 7.99a8.42 8.42 0 0 0-4.22-5.84A8.4 8.4 0 0 0 12 .5a8.4 8.4 0 0 0-5.78 1.65A8.42 8.42 0 0 0 2 7.99l10 12.5 10-12.5Z"></path>
                                </svg>
                            </div>
                        </div>
                        <AlertTitle className="text-center text-lg font-semibold text-green-800">Verification Email Sent</AlertTitle>
                        <AlertDescription className="text-center">
                            <p className="mt-2 text-sm text-green-700">
                                We've sent a verification email to <span className="font-medium">{formData.email}</span>.
                                Please check your inbox and click on the verification link to complete your registration.
                            </p>
                            <p className="mt-2 text-xs text-green-600">
                                If you don't see the email, please check your spam folder.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 w-full border-green-300 text-green-700 hover:bg-green-100"
                                asChild
                            >
                                <Link href="/organization/signin">
                                    Return to Sign In
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : (
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
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSigningUp}
                        >
                            {isSigningUp ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}

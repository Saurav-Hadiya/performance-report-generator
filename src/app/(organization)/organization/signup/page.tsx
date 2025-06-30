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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create Organization
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Start managing your team's performance
                    </p>
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/organization/signin" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>

                {verificationSent ? (
                    /* Success State */
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <AlertTitle className="text-xl font-bold text-green-800 mb-3">
                                    Verification Email Sent!
                                </AlertTitle>
                                <AlertDescription className="text-center space-y-4">
                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-sm text-green-700">
                                            We've sent a verification email to:
                                        </p>
                                        <p className="text-sm font-semibold text-green-800 mt-1">
                                            {formData.email}
                                        </p>
                                    </div>
                                    <div className="text-sm text-green-700 space-y-2">
                                        <p>
                                            Please check your inbox and click on the verification link to complete your registration.
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Don't see the email? Check your spam folder or try again in a few minutes.
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                        asChild
                                    >
                                        <Link href="/organization/signin">
                                            Return to Sign In
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </div>
                        </Alert>
                    </div>
                ) : (
                    /* Signup Form */
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
                                        className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                                        placeholder="your@organization.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
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
                                        autoComplete="new-password"
                                        required
                                        className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>


                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                disabled={isSigningUp}
                            >
                                {isSigningUp ? (
                                    <div className="flex items-center space-x-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    'Create Organization Account'
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Footer Section */}
                {!verificationSent && (
                    <div className="mt-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-500">
                                    Employee Login
                                </span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-500 font-medium transition-colors group"
                            >
                                <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Sign in as Employee</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

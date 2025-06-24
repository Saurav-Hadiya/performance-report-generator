import { createClient } from './lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = await createClient();

    // Check if user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const url = req.nextUrl.clone();

    // Handle organization routes
    if (url.pathname.startsWith('/organization')) {
        // Skip auth check for signin and signup routes
        if (url.pathname === '/organization/signin' || url.pathname === '/organization/signup') {
            // If already authenticated as organization, redirect to dashboard
            if (user?.user_metadata?.role === 'organization') {
                url.pathname = '/organization/dashboard';
                return NextResponse.redirect(url);
            }
            return res;
        }

        // Protect all other organization routes
        if (!user || user.user_metadata?.role !== 'organization') {
            url.pathname = '/organization/signin';
            return NextResponse.redirect(url);
        }

        // Check organization details status with API call
        const checkDetailsResponse = async () => {
            try {
                return await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/organization/details`, {
                    headers: {
                        'Content-Type': 'application/json',
                        // Forward the authorization header to maintain the session
                        'Cookie': req.headers.get('cookie') || '',
                        'Authorization': req.headers.get('authorization') || '',
                    },
                });
            } catch (error) {
                console.error('Error checking org details:', error);
                return null;
            }
        };

        // For the details page, redirect to dashboard if details are already completed
        if (url.pathname === '/organization/details') {
            const response = await checkDetailsResponse();
            if (response && response.ok) {
                const data = await response.json();
                if (data.detailsCompleted) {
                    // If details are already completed, redirect to dashboard
                    url.pathname = '/organization/dashboard';
                    return NextResponse.redirect(url);
                }
            }
            return res;
        }

        // For protected routes, check if details are completed
        // Except for API routes which handle their own auth
        if (!url.pathname.startsWith('/organization/api') &&
            (url.pathname.startsWith('/organization/dashboard') ||
                url.pathname.startsWith('/organization/employees') ||
                url.pathname.startsWith('/organization/reports') ||
                url.pathname.startsWith('/organization/settings'))) {

            const response = await checkDetailsResponse();
            if (!response || !response.ok) {
                // Error checking status - err on the side of caution and redirect to details
                url.pathname = '/organization/details';
                return NextResponse.redirect(url);
            }

            const data = await response.json();

            // If details aren't completed, redirect to the details page
            if (!data.detailsCompleted) {
                url.pathname = '/organization/details';
                return NextResponse.redirect(url);
            }
        }

        return res;
    }

    // Handle employee routes (not in /organization path)
    // Skip auth check for public routes
    if (url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/signup') ||
        url.pathname.startsWith('/reset-password') ||
        url.pathname.startsWith('/update-password') ||
        url.pathname.startsWith('/_next') ||
        url.pathname === '/favicon.ico') {

        // If accessing login while already authenticated as employee
        if (url.pathname === '/login' && user?.user_metadata?.role === 'employee') {
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        // For signup, only redirect if authenticated AND there are no invitation params
        if (url.pathname === '/signup' &&
            user?.user_metadata?.role === 'employee' &&
            !url.searchParams.has('organization_id') &&
            !url.searchParams.has('email')) {
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        return res;
    }

    // Protect employee routes
    if (!user || user.user_metadata?.role !== 'employee') {
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return res;
}

// Specify which routes this middleware should run on
export const config = {
    matcher: [
        // Organization routes
        '/organization/:path*',
        // Employee routes - everything except specific public pages
        '/((?!api|_next/static|_next/image|favicon.ico|login|signup|reset-password|update-password).*)',
    ],
};

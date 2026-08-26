import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/financial-insights'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (path.startsWith('/assets/') || 
      path.startsWith('/_next/') || 
      path.startsWith('/api/') ||
      path.startsWith('/favicon.ico') ||
      path.endsWith('.mp4') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.gif') ||
      path.endsWith('.svg') ||
      path.endsWith('.ico') ||
      path.includes('.')) {
    return res;
  }

  if (publicRoutes.includes(path)) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient({ req, res });

    // Try to get session, but don't be overly aggressive about failures
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    // If there's an error getting session, let the client-side auth handle it
    if (error) {
      console.warn('Middleware session error:', error.message);
      // Don't redirect on session errors - let client handle it
      return res;
    }

    // If user is signed in and trying to access login/register pages, redirect appropriately
    if (session && (path === '/login' || path === '/register')) {
      // Check if there's a redirectTo parameter
      const redirectTo = req.nextUrl.searchParams.get('redirectTo');
      const redirectUrl = redirectTo || '/';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // For protected routes without session, only redirect if we're sure there's no session
    // This is less aggressive than before - we let the client-side auth handle edge cases
    if (!session) {
      // Only redirect for clearly protected routes, not edge cases
      const protectedPaths = ['/profile', '/research-memory', '/knowledge-repo', '/tools'];
      const isProtectedPath = protectedPaths.some(protectedPath => path.startsWith(protectedPath));
      
      if (isProtectedPath) {
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Set cache control headers for better performance
    res.headers.set('Cache-Control', 'no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');

    return res;
  } catch (error) {
    // If middleware fails completely, log but don't block the request
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     * - api (API routes)
     * - Any file with an extension
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|api/|.*\\..*).*)',
  ],
}; 
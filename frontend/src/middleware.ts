import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const allowedRoles = ['STUDENT', 'DOCTOR', 'TA', 'ADVISOR', 'HEAD', 'ADMIN', 'SUPER_ADMIN'] as const

// Role-to-path prefix mapping for dashboard access
const rolePathMap: Record<string, string[]> = {
  SUPER_ADMIN: ['/admin'],
  ADMIN: ['/admin'],
  DOCTOR: ['/faculty'],
  TA: ['/ta'],
  ADVISOR: ['/advisor'],
  HEAD: ['/head'],
  STUDENT: ['/student'],
}

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api',
]

// Shared routes accessible to all authenticated roles
const sharedRoutes = [
  '/ai-assistant',
  '/settings',
]

function getTokenFromRequest(request: NextRequest): string | null {
  const authCookie = request.cookies.get('auth-token')
  if (authCookie?.value) return authCookie.value
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  return null
}

function parseToken(token: string): { sub: string; role: string; exp: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { sub: payload.sub, role: payload.role, exp: payload.exp }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = getTokenFromRequest(request)

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = parseToken(token)
  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete('auth-token')
    return res
  }

  // Allow shared routes accessible to all authenticated roles
  if (sharedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check role-based access
  const allowedPaths = rolePathMap[payload.role]
  if (allowedPaths) {
    const hasAccess = allowedPaths.some(p => pathname.startsWith(p))
    if (!hasAccess && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      const dashboard = allowedPaths[0]
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}

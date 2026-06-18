import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-pw']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const session = request.cookies.get('appwrite-session')

	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

	if (!session && !isAuthRoute) {
		return NextResponse.redirect(new URL('/signin', request.url))
	}

	if (session && isAuthRoute) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)'],
}

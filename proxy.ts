import { NextRequest, NextResponse } from 'next/server'
import { DEMO_MODE_COOKIE } from '@/lib/demo-data'

// Landing on any real auth route is treated as "log out of demo mode" —
// otherwise (auth)/layout.tsx's own getLoggedInUser() check sees the demo
// cookie, thinks someone's logged in, and bounces the visitor straight back
// to '/' before the sign-in form ever renders.
//
// Cookie mutation has to happen here rather than in the layout itself:
// Server Components can only read cookies, not write them — set/delete is
// only allowed in a Server Action, Route Handler, or Proxy (this file — the
// renamed successor to Next's old "Middleware" file convention).
//
// Deleting the cookie on the response only affects the *next* request the
// browser sends — it does not retroactively change what this request's own
// render sees. So rather than lean on same-request header-forwarding (which
// bounced the very first click back to '/' before the cookie deletion had
// actually reached the browser, requiring a second click to land on the
// real page), redirect back to this same URL once. That forces the browser
// to make a fresh request — this time with the cookie already gone — before
// the page ever renders. One extra same-origin round trip, but no flash and
// no need to click twice. request.nextUrl (not just pathname) preserves
// query params, which reset-pw's recovery link depends on.
export function proxy(request: NextRequest) {
	if (!request.cookies.has(DEMO_MODE_COOKIE)) {
		return NextResponse.next()
	}

	const response = NextResponse.redirect(request.nextUrl)
	response.cookies.delete(DEMO_MODE_COOKIE)
	return response
}

export const config = {
	matcher: ['/signin', '/forgot-password', '/reset-pw'],
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DEMO_MODE_COOKIE } from '@/lib/demo-data'

export async function GET() {
	const cookieStore = await cookies()
	cookieStore.set(DEMO_MODE_COOKIE, '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: true,
	})

	redirect('/')
}

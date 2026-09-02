import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'
import { MobileContainer } from '@/components/mobile-container'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()
	if (!loggedIn) return redirect('/welcome')

	return <MobileContainer>{children}</MobileContainer>
}

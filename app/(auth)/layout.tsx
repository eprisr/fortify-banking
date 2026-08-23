import { MobileContainer } from '@/components/mobile-container'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()
	if (loggedIn) redirect('/')

	return (
		<MobileContainer>
			<main className="flex flex-col w-full font-sans">{children}</main>
		</MobileContainer>
	)
}

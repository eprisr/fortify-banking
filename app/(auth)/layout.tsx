import { MobileContainer } from '@/components/mobile-container'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()
	if (loggedIn) return redirect('/')

	return (
		<MobileContainer>
			<main className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto no-scrollbar font-sans">
				{children}
			</main>
		</MobileContainer>
	)
}

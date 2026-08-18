import MobileMenu from '@/components/MobileMenu'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'
import { MobileContainer } from '@/components/mobile-container'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()
	if (!loggedIn) redirect('/welcome')

	return (
		<MobileContainer>
			<main className="flex flex-col w-full mb-[80px] font-poppins">
				{children}
				<MobileMenu />
			</main>
		</MobileContainer>
	)
}

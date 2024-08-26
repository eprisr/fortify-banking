import MobileMenu from '@/components/MobileMenu'
import Navbar from '@/components/Navbar'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()

	if (!loggedIn) redirect('/signin')

	return (
		<main className="flex flex-col w-full mb-[80px] font-poppins bg-indigo-700">
			<Navbar user={loggedIn} type="main" />
			{children}
			<MobileMenu />
		</main>
	)
}

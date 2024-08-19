import Navbar from '@/components/Navbar'
import { getLoggedInUser } from '@/lib/actions/user.actions'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = await getLoggedInUser()

	return (
		<main className="flex flex-col w-full font-poppins bg-indigo-700">
			<Navbar user={loggedIn} type="main" />
			{children}
		</main>
	)
}

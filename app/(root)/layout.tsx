import Navbar from '@/components/Navbar'

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const loggedIn = { firstName: 'Jane', lastName: 'Doe' }

	return (
		<main className="flex flex-col w-full font-poppins bg-indigo-700">
			<Navbar user={loggedIn} type="main" />
			{children}
		</main>
	)
}

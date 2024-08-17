import Navbar from '@/components/Navbar'

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<main className="flex flex-col w-full font-poppins bg-indigo-700">
			{children}
		</main>
	)
}

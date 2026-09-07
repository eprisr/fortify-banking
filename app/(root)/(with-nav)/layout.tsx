import MobileMenu from '@/components/MobileMenu'

export default function WithNavLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<>
			<main className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto no-scrollbar pb-20 font-sans">
				{children}
			</main>
			<MobileMenu />
		</>
	)
}

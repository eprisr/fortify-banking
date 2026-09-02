export default function NoNavLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<main className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto no-scrollbar font-sans">
			{children}
		</main>
	)
}

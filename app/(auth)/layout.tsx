export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return <main className="flex flex-col w-full font-poppins">{children}</main>
}

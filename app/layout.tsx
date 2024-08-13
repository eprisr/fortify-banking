import type { Metadata } from 'next'
import { Fira_Sans, IBM_Plex_Serif, Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
	weight: ['400', '500', '600'],
	subsets: ['latin'],
	variable: '--font-poppins',
})
const firaSans = Fira_Sans({
	weight: '400',
	subsets: ['latin'],
	variable: '--font-fira-sans',
})
const ibmPlexSerif = IBM_Plex_Serif({
	weight: ['400', '700'],
	subsets: ['latin'],
	variable: '--font-ibm-plex-serif',
})

export const metadata: Metadata = {
	title: 'Fortify',
	description:
		'Providing a secure and reliable foundation for customers to build and protect their financial success',
	icons: {
		icon: '/icons/logo.svg',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body
				className={`${poppins.variable} ${firaSans.variable} ${ibmPlexSerif.variable}`}>
				{children}
			</body>
		</html>
	)
}

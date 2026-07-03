import type { Metadata, Viewport } from 'next'
import { Fira_Sans, IBM_Plex_Serif, Poppins, Inter } from 'next/font/google'
import './globals.css'
import { MobileContainer } from '@/components/mobile-container'
import { cn } from '@/lib/utils'

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

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
		<html
			lang="en"
			suppressHydrationWarning
			className={cn('font-sans', inter.variable)}>
			<body
				className={`${poppins.variable} ${firaSans.variable} ${ibmPlexSerif.variable}`}>
				<MobileContainer>{children}</MobileContainer>
			</body>
		</html>
	)
}

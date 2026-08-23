import type { Metadata, Viewport } from 'next'
import {
	DM_Mono,
	DM_Sans,
	Fira_Sans,
	IBM_Plex_Serif,
	Inter,
	Poppins,
	Sora,
} from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const dmMono = DM_Mono({
	weight: ['400', '500'],
	subsets: ['latin'],
	variable: '--font-dm-mono',
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
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
	weight: ['400', '500', '600'],
	subsets: ['latin'],
	variable: '--font-poppins',
})
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

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
				className={`${poppins.variable} ${firaSans.variable} ${ibmPlexSerif.variable} ${inter.variable} ${dmSans.variable} ${dmMono.variable} ${sora.variable}`}>
				<div>{children}</div>
			</body>
		</html>
	)
}

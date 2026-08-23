import { MobileContainer } from '@/components/mobile-container'

export default function OnboardingLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<MobileContainer>
			<main className="flex flex-col w-full font-sans">{children}</main>
		</MobileContainer>
	)
}

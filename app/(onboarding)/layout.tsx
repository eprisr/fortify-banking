import { MobileContainer } from '@/components/mobile-container'

export default function OnboardingLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<MobileContainer>
			<main className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto no-scrollbar font-sans">
				{children}
			</main>
		</MobileContainer>
	)
}

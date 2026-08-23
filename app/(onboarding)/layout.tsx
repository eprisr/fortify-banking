import { MobileContainer } from '@/components/mobile-container'

// Unlike (auth), this group is intentionally not guarded by a logged-in
// redirect: signup transitions the user from anonymous to logged-in
// mid-flow (step one creates the session), and confirmation is only ever
// reached by a user who just did that. Guarding either page against
// "already logged in" would bounce the user home mid-signup — see the
// bug where step two flashed and immediately redirected to '/'.
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

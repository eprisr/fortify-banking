'use client'

import CustomInput from '@/components/CustomInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { WaitlistValues } from '@/lib/auth-form-config'
import { waitlistSchema } from '@/lib/utils'
import logo from '@/public/icons/logo.svg'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useForm } from 'react-hook-form'

const Landing = () => {
	const form = useForm<WaitlistValues>({
		resolver: zodResolver(waitlistSchema),
		mode: 'onSubmit',
		defaultValues: {
			email: '',
		},
	})

	return (
		<div className="text-gray-600 text-14 font-dm-sans">
			<div className="flex items-center justify-between px-10 py-4">
				<div className="flex items-center gap-2">
					<Image src={logo} alt="Fortify Banking Logo" width={32} height={32} />
					<p className="text-16 font-bold">Fortify</p>
				</div>
				<ul className="flex items-center gap-7">
					<li>Features</li>
					<li>How it works</li>
					<li>Security</li>
				</ul>
				<div>
					<Button variant="ghost" className="mr-4">
						Sign in
					</Button>
					<Button variant="default">Get early access</Button>
				</div>
			</div>
			<div className="flex justify-between px-40 py-5 bg-primary-100">
				<div className="max-w-1/3">
					<h1>Your money, finally clear.</h1>
					<p>
						Fortify connects to your bank and turns raw transactions into a
						clear picture of where your money goes — and where it should go
						next.
					</p>
					<div className="flex gap-4">
						<Button variant="default">Get early access</Button>
						<Button variant="outline">See how it works</Button>
					</div>
					<div className="flex gap-3">
						<div></div>
						<div>
							<p>240+ people on the waitlist</p>
							<p>Join them — it's free</p>
						</div>
					</div>
				</div>
				<div className="w-3xs h-96 border-2 border-gray-800">
					<p>Image</p>
				</div>
			</div>
			<div className="h-12 py-2 w-full bg-gray-100 border border-gray-300">
				<ul className="flex gap-16 items-center">
					<li>256-bit encryption</li>
					<li>Read-only access</li>
					<li>Zero data selling</li>
					<li>Bank-grade security</li>
					<li>Real-time sync</li>
					<li>Plaid-powered</li>
					<li>Spending Insights</li>
					<li>Cash flow tracking</li>
				</ul>
			</div>
			<div className="flex flex-col items-center justify-center gap-10 px-40 py-20">
				<div className="text-center">
					<p>Features</p>
					<h3>Everything your finances need</h3>
					<p>Built for people who want clarity, not complexity.</p>
				</div>
				<div className="flex flex-wrap gap-4">
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>Spending insights</h5>
						<p>
							Every transaction categorized automatically. See your top spending
							categories, month-over-month trends, and where your money actually
							goes — no spreadsheets.
						</p>
					</div>
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>All accounts, one place</h5>
						<p>
							Connect checking, savings, and credit in seconds via Plaid. Your
							full financial picture — balances, net worth, available credit —
							updated in real time.
						</p>
					</div>
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>Smart alerts</h5>
						<p>
							Get notified the moment unusual activity hits your account. Large
							transactions, low balance warnings, and spending nudges — before
							they become problems.
						</p>
					</div>
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>Transfers & bill pay</h5>
						<p>
							Move money between accounts or pay bills directly from Vaultly —
							powered by Dwolla's ACH network. Fast, secure, a few taps away.
						</p>
					</div>
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>Cash flow tracking</h5>
						<p>
							Month-by-month income vs. expenses. Spot surplus months at a
							glance, catch deficits early, understand your trend line before it
							becomes a problem.
						</p>
					</div>
					<div className="w-[calc(33%-32px)] h-fit border border-gray-100 rounded-xl p-6">
						<h5>Built to protect you</h5>
						<p>
							Read-only access means we can see your data, never touch your
							money. All data encrypted at rest and in transit. Your credentials
							never touch our servers.
						</p>
					</div>
				</div>
			</div>
			<div className="flex flex-col items-center justify-center gap-10 px-40 py-20">
				<div className="text-center">
					<p>How It Works</p>
					<h3>Up and running in three steps</h3>
				</div>
				<div className="flex text-center">
					<div className="w-1/3">
						<div className="flex items-center justify-center w-10 h-10 p-2 bg-primary-700 text-white rounded-xl m-0 m-auto">
							<span className="">1</span>
						</div>
						<p>Create your account</p>
						<p className="w-[32ch] m-0 m-auto">
							Sign up with your name and email in under a minute. No credit
							card, no commitments.
						</p>
					</div>
					<div className="w-1/3">
						<div className="flex items-center justify-center w-10 h-10 p-2 bg-primary-700 text-white rounded-xl m-0 m-auto">
							<span className="">2</span>
						</div>
						<p>Connect your bank</p>
						<p className="w-[32ch] m-0 m-auto">
							Link your bank securely via Plaid. Read-only access — we can see
							your data, never touch your money.
						</p>
					</div>
					<div className="w-1/3">
						<div className="flex items-center justify-center w-10 h-10 p-2 bg-primary-700 text-white rounded-xl m-0 m-auto">
							<span className="">3</span>
						</div>
						<p>See your full picture</p>
						<p className="w-[32ch] m-0 m-auto">
							Your dashboard comes to life instantly — balances, spending
							trends, and transactions in one clean view.
						</p>
					</div>
				</div>
			</div>
			<div className="flex items-center justify-between px-30 py-20">
				<div className="w-1/2">
					<p>Security</p>
					<h3>Built with your safety first.</h3>
					<p className="w-[32ch]">
						Handing over access to your finances requires real trust. Every
						technical decision — from Plaid's read-only OAuth to Dwolla's ACH
						infrastructure — was made with that in mind.
					</p>
					<div className="flex gap-4">
						<div>Badge</div>
						<div>Badge</div>
					</div>
				</div>
				<div className="flex flex-wrap">
					<div className="border border-gray-100 rounded-xl p-4">
						<p>256-bit SSL encryption</p>
						<p className="w-[24ch]">
							All data is encrypted in transit and at rest.
						</p>
					</div>
					<div className="border border-gray-100 rounded-xl p-4">
						<p>Read-only bank access</p>
						<p className="w-[24ch]">
							We can view transactions. We can never move money.
						</p>
					</div>
					<div className="border border-gray-100 rounded-xl p-4">
						<p>Zero data selling</p>
						<p className="w-[24ch]">
							Your financial data is never sold to third parties.
						</p>
					</div>
					<div className="border border-gray-100 rounded-xl p-4">
						<p>Plaid-powered</p>
						<p className="w-[24ch]">
							Trusted bank connection infrastructure used by thousands of
							fintech apps.
						</p>
					</div>
					<div className="border border-gray-100 rounded-xl p-4">
						<p>Secure infrastructure</p>
						<p className="w-[24ch]">
							Built on infrastructure that meets enterprise security standards.
						</p>
					</div>
					<div className="border border-gray-100 rounded-xl p-4">
						<p>Credentials never stored</p>
						<p className="w-[24ch]">
							Your bank login is processed by Plaid, never touches our servers.
						</p>
					</div>
				</div>
			</div>
			<div className="flex items-center justify-center text-center px-30 py-20">
				<div className="w-1/3">
					<p className="mb-4">logo</p>
					<h3>Ready to see where your money really goes?</h3>
					<p>
						Join the early access list. We're onboarding users in small batches
						— no spam, just a heads-up when your spot is ready.
					</p>
					<div className="flex gap-4 mt-8 mb-4">
						<Form {...form}>
							<form>
								<CustomInput
									control={form.control}
									name="email"
									label="Email"
									placeholder="your@email.com"
								/>
								<Button>Join waitlist</Button>
							</form>
						</Form>
					</div>
					<p>No credit card · No commitments · Unsubscribe anytime</p>
				</div>
			</div>
			<div className="flex justify-between">
				<div>
					<p>logo</p>
					<p>
						Your money, finally clear. Built with Next.js, Plaid, and Dwolla.
					</p>
				</div>
				<div>
					<div>
						<p>Product</p>
						<ul>
							<li>Features</li>
							<li>Security</li>
							<li>How it works</li>
							<li>Changelog</li>
						</ul>
					</div>
					<div>
						<p>Company</p>
						<ul>
							<li>About</li>
							<li>Blog</li>
							<li>Privacy</li>
							<li>Terms</li>
						</ul>
					</div>
				</div>
				<p>&copy; 2026 Fortify Built by Epris Richardson</p>
				<p>Powered by Plaid Dwolla Appwrite</p>
			</div>
		</div>
	)
}

export default Landing

import { Button } from '@/components/ui/button'

const Landing = async () => {
	return (
		<div>
			<div className="flex justify-between px-10 py-4">
				<p>Logo</p>
				<ul className="flex gap-7">
					<li>Features</li>
					<li>How it works</li>
					<li>Security</li>
				</ul>
				<div>
					<Button variant="ghost">Sign in</Button>
					<Button variant="default">Get early access</Button>
				</div>
			</div>
			<div className="flex justify-between px-40 py-5">
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
				<ul className="flex gap-16 content-center">
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
			<div className="flex flex-col content-center justify-center gap-10 px-40 py-20">
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
			<div>
				<p>How It Works</p>
			</div>
			<div>
				<p>Security</p>
			</div>
			<div>
				<p>CTA</p>
			</div>
			<div>
				<p>Footer</p>
			</div>
		</div>
	)
}

export default Landing

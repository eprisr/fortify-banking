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
			<div>
				<p>Features</p>
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

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
			<div>
				<p>Hero</p>
			</div>
			<div>
				<p>Marquee</p>
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

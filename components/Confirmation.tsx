'use client'

import { Check, Clock, Lightbulb } from 'lucide-react'
import { Item, ItemContent, ItemDescription, ItemMedia } from './ui/item'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import PlaidLink from './PlaidLink'

const Confirmation = ({
	connected = false,
	user,
}: {
	connected?: boolean
	user: any
}) => {
	const router = useRouter()
	return (
		<div className="flex flex-col gap-2 justify-center">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col items-center gap-1 md:gap-3 text-center">
					{connected && (
						<div className="flex flex-center h-13 w-13 rounded-full bg-semantic-success/10">
							<Check className="text-semantic-success" size={24} />
						</div>
					)}
					<p
						className={`uppercase ${connected ? 'text-semantic-success' : 'text-semantic-warning'} text-sm tracking-wider font-semibold`}>
						{connected ? 'Bank connected' : 'Account created'}
					</p>
					<h1 className="text-3xl font-bold">
						{connected ? "You're all set!" : 'Welcome aboard!'}
					</h1>
					<p className="font-normal text-ink/70">
						{connected
							? 'Your account is created and your bank is connected. Your real balances, transactions, and insights are ready.'
							: "You're browsing with sample data — connect your bank anytime to unlock everything."}
					</p>
				</div>
			</header>
			<Item
				className={`${connected ? 'bg-sage/10' : 'bg-gold/20'} p-6 rounded-md my-6`}>
				<ItemMedia
					variant="icon"
					className="[&_svg:not([class*='size-'])]:size-5">
					{connected ? (
						<Clock
							className={`${connected ? 'text-semantic-success' : 'text-semantic-warning'}`}
							size={20}
						/>
					) : (
						<Lightbulb
							className={`${connected ? 'text-semantic-success' : 'text-semantic-warning'}`}
							size={20}
						/>
					)}
				</ItemMedia>
				<ItemContent>
					<ItemDescription className="text-sm line-clamp-none">
						<span
							className={`${connected ? 'text-semantic-success' : 'text-semantic-warning'} font-bold`}>
							Good to know:{' '}
						</span>
						{connected
							? 'Full transaction history usually finishes syncing within a few minutes — no need to keep this screen open.'
							: "Some features like transfers, bill pay, and spending insights won't be available until you connect a bank account."}
					</ItemDescription>
				</ItemContent>
			</Item>
			<Button
				type="button"
				onClick={() => router.push('/')}
				className="py-4 text-base shadow-xl">
				{connected ? 'Go to dashboard' : 'Explore the app'} &#8594;
			</Button>
			{!connected && (
				<PlaidLink
					user={user}
					variant="ghost"
					text="Or connect your bank now"
					redirectTo="/confirmation?connected=true"
				/>
			)}
		</div>
	)
}

export default Confirmation

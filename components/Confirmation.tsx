'use client'

import { Lightbulb } from 'lucide-react'
import { Item, ItemContent, ItemDescription, ItemMedia } from './ui/item'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

const Confirmation = ({ connected = false }: { connected?: boolean }) => {
	const router = useRouter()

	return (
		<div className="flex flex-col gap-2 justify-center">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-2xl lg:text-36 font-semibold text-primary-700 text-center">
						Welcome Aboard!
					</h1>
					<p className="text-xs font-normal text-gray-600 text-center">
						{connected
							? "Your account is created and your bank is connected. You're all set."
							: "Your account is created. You're browsing with sample data — connect your bank anytime to unlock everything."}
					</p>
				</div>
			</header>
			{!connected && (
				<Item variant="muted">
					<ItemMedia variant="icon">
						<Lightbulb />
					</ItemMedia>
					<ItemContent>
						<ItemDescription>
							<span className="text-orange-400 font-bold">Good to know: </span>
							Some features like transfers, bill pay, and spending insights
							won't be available until you connect a bank account.
						</ItemDescription>
					</ItemContent>
				</Item>
			)}
			<Button type="button" onClick={() => router.push('/')}>
				Explore the app &#8594;
			</Button>
		</div>
	)
}

export default Confirmation

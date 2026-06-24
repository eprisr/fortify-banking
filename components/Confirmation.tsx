'use client'

import { Lightbulb } from 'lucide-react'
import { Item, ItemContent, ItemDescription, ItemMedia } from './ui/item'
import { Button } from './ui/button'

const Confirmation = () => {
	return (
		<div>
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-primary-700 text-center">
						Welcome Aboard!
					</h1>
					<p className="text-12 font-normal text-gray-600 text-center">
						Your account is created. You're browsing with sample data — connect
						your bank anytime to unlock everything.
					</p>
				</div>
			</header>
			<Item variant="muted">
				<ItemMedia variant="icon">
					<Lightbulb />
				</ItemMedia>
				<ItemContent>
					<ItemDescription>
						<span className="text-orange-400 font-bold">Good to know: </span>
						Some features like transfers, bill pay, and spending insights won't
						be available until you connect a bank account.
					</ItemDescription>
				</ItemContent>
			</Item>
			<Button type="button">Explore the app &#8594;</Button>
		</div>
	)
}

export default Confirmation

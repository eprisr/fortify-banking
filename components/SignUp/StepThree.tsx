'use client'

import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'
import {
	Ban,
	ChartNoAxesColumn,
	Eye,
	Landmark,
	Lock,
	PiggyBank,
	TriangleAlert,
} from 'lucide-react'

const features = [
	{
		title: 'Spending Insights',
		desc: 'See exactly where your money goes, automatically categorized.',
		icon: 'chart',
	},
	{
		title: 'Net worth tracking',
		desc: 'All your balances in one place, updated in real time.',
		icon: 'money',
	},
	{
		title: 'Smart alerts',
		desc: 'Know the moment unusual activity hits your account.',
		icon: 'alert',
	},
]

const StepThree = () => {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<ItemGroup className="gap-4">
				{features.map((feat) => (
					<Item key={feat.title} variant="outline" asChild role="listitem">
						<div>
							<ItemMedia variant="icon" className="self-center!">
								{feat.icon === 'chart' && <ChartNoAxesColumn size={60} />}
								{feat.icon === 'money' && <PiggyBank size={60} />}
								{feat.icon === 'alert' && <TriangleAlert size={60} />}
							</ItemMedia>
							<ItemContent>
								<ItemTitle className="line-clamp-1">{feat.title}</ItemTitle>
								<ItemDescription>{feat.desc}</ItemDescription>
							</ItemContent>
						</div>
					</Item>
				))}
			</ItemGroup>
			<Item
				className="justify-between"
				variant="outline"
				asChild
				role="listitem">
				<div>
					<div className="flex flex-col">
						<ItemMedia variant="icon">
							<Lock />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-10!">256-bit SSL</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col">
						<ItemMedia variant="icon">
							<Eye />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-10!">Read-only</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col">
						<ItemMedia variant="icon">
							<Ban />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-10!">Never sold</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col">
						<ItemMedia variant="icon">
							<Landmark />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-10!">10,000+ banks</ItemTitle>
						</ItemContent>
					</div>
				</div>
			</Item>
		</div>
	)
}

export default StepThree

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

const StepTwo = () => {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<ItemGroup className="gap-4">
				{features.map((feat) => (
					<Item
						key={feat.title}
						asChild
						role="listitem"
						className="rounded-sm bg-cloud/60 p-5">
						<div>
							<ItemMedia
								variant="icon"
								className="self-center! w-10 h-10 [&_svg:not([class='size-'])]:size-7">
								{feat.icon === 'chart' && (
									<ChartNoAxesColumn size={28} strokeWidth={1.25} />
								)}
								{feat.icon === 'money' && (
									<PiggyBank size={28} strokeWidth={1.25} />
								)}
								{feat.icon === 'alert' && (
									<TriangleAlert size={28} strokeWidth={1.25} />
								)}
							</ItemMedia>
							<ItemContent>
								<ItemTitle className="line-clamp-1">{feat.title}</ItemTitle>
								<ItemDescription>{feat.desc}</ItemDescription>
							</ItemContent>
						</div>
					</Item>
				))}
			</ItemGroup>
			<Item className="justify-between text-ink/70" asChild role="listitem">
				<div>
					<div className="flex flex-col gap-2">
						<ItemMedia variant="icon">
							<Lock />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xxs!">256-bit SSL</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col gap-2">
						<ItemMedia variant="icon">
							<Eye />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xxs!">Read-only</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col gap-2">
						<ItemMedia variant="icon">
							<Ban />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xxs!">Never sold</ItemTitle>
						</ItemContent>
					</div>
					<div className="flex flex-col gap-2">
						<ItemMedia variant="icon">
							<Landmark />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="text-xxs!">10,000+ banks</ItemTitle>
						</ItemContent>
					</div>
				</div>
			</Item>
		</div>
	)
}

export default StepTwo

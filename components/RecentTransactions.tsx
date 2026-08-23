import Image from 'next/image'

import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'
import { Card, CardContent } from './ui/card'
import { ArrowRight, DollarSign } from 'lucide-react'

export const RecentTransactions = ({ transactions = [] }: TransactionTableProps) => {
	const getRecentTransactions = [...transactions]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 5)

	return (
		<div className="flex w-full max-w-md flex-col gap-1">
			<div className="flex justify-between">
				<h4 className="text-14">Recent</h4>
				<p className="text-12">
					See All <ArrowRight size={12} className="inline" />
				</p>
			</div>
			<Card className="py-0 rounded-lg shadow-card ring-0">
				<CardContent className="px-0">
					<ItemGroup className="gap-4">
						{getRecentTransactions.map((t) => (
							<Item key={t.id} size="sm" asChild role="listitem">
								<a href="#">
									{t.image ? (
										<ItemMedia variant="image">
											<Image
												src={t.image}
												alt={t.name}
												width={32}
												height={32}
												className="object-cover rounded-md"
											/>
										</ItemMedia>
									) : (
										<div className="h-8 w-8 rounded-md bg-primary-700 text-white flex items-center justify-center">
											<DollarSign size={16} strokeWidth={3} />
										</div>
									)}
									<ItemContent>
										<ItemTitle className="line-clamp-1">{t.name} - </ItemTitle>
										<ItemDescription>{t.date}</ItemDescription>
									</ItemContent>
									<ItemContent className="flex-none text-center">
										<ItemDescription
											className={`${t.type === 'credit' ? 'text-primary' : 'text-fortify-rose'}`}>
											<span>{t.type === 'credit' ? '+' : '-'}$</span>
											{Math.abs(t.amount).toFixed(2)}
										</ItemDescription>
									</ItemContent>
								</a>
							</Item>
						))}
					</ItemGroup>
				</CardContent>
			</Card>
		</div>
	)
}

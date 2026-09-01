import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from '@/components/ui/item'
import { Card, CardContent } from './ui/card'

export const RecentTransactions = ({
	transactions = [],
}: TransactionTableProps) => {
	const getRecentTransactions = [...transactions]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 5)

	const formatDate = (t: string) => {
		const date = new Date(t)
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}

	return (
		<div className="flex w-full max-w-md flex-col gap-5">
			<div className="flex justify-between items-center">
				<h4 className="text-base font-heading font-semibold">
					Recent activity
				</h4>
				<p className="text-xs text-primary font-semibold">See all</p>
			</div>
			<Card className="bg-white py-0 ring-0">
				<CardContent className="px-0">
					<ItemGroup className="gap-4">
						{getRecentTransactions.map((t) => (
							<Item
								key={t.id}
								size="sm"
								asChild
								role="listitem"
								className="bg-cloud rounded-lg">
								<a href="#">
									<ItemContent>
										<ItemTitle className="text-sm font-semibold line-clamp-1">
											{t.name}
										</ItemTitle>
										<ItemDescription className="text-ink/70">
											{formatDate(t.date)} &middot; {t.category}
										</ItemDescription>
									</ItemContent>
									<ItemContent className="flex-none text-center">
										<ItemDescription
											className={`${t.type === 'credit' ? 'text-semantic-success' : 'text-ink'} font-mono text-base`}>
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

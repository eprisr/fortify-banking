'use client'

import {
	formatAmount,
	getCurrentMonthName,
	getTrailingMonthsYYYYMM,
	sumTransTotalsByKey,
} from '@/lib/utils'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card'
import { BiDownArrow, BiUpArrow } from 'react-icons/bi'
import { Field, FieldLabel } from './ui/field'
import { Progress } from './ui/progress'

const MonthSpend = ({ transactions = [] }: TransactionTableProps) => {
	const currMonthName = getCurrentMonthName()
	const lastYear = getTrailingMonthsYYYYMM()

	const transactionsByMonth = () => {
		const byMonth = lastYear.map((month) => {
			const [bucketYear, bucketMonth] = month.split('-').map(Number)
			const filteredTransactions = transactions.filter((trans) => {
				const tDate = new Date(trans.date)
				return (
					tDate.getMonth() + 1 === bucketMonth &&
					tDate.getFullYear() === bucketYear
				)
			})
			return {
				month: new Date(month + 'T00:00:00').toDateString().slice(4, 8),
				transactions: filteredTransactions,
			}
		})
		return byMonth
	}

	const monthlyTotal = () => {
		const totalsByMonth = transactionsByMonth().map((trans) => {
			return {
				month: new Date(trans.month + 'T00:00:00').toDateString().slice(4, 8),
				totals: sumTransTotalsByKey(trans.transactions, 'type', 'amount'),
			}
		})
		return totalsByMonth
	}

	const chartData = monthlyTotal()

	const currMonthNum: number = chartData.length - 1
	const currMonthSpend: number = chartData[currMonthNum].totals.debit
		? Number(chartData[currMonthNum].totals.debit.toFixed(2))
		: 0
	const prevMonthSpend: number = chartData[currMonthNum - 1].totals.debit
		? Number(chartData[currMonthNum - 1].totals.debit.toFixed(2))
		: 0
	const lastMonthCompare: number = prevMonthSpend
		? Number(
				(((currMonthSpend - prevMonthSpend) / prevMonthSpend) * 100).toFixed(1),
			)
		: 0

	const categoryTotal = () => {
		const totalsByCat = sumTransTotalsByKey(
			transactionsByMonth()[13].transactions,
			'category',
			'amount',
		)
		return totalsByCat
	}

	const topCategories = () => {
		const totals = Object.entries(categoryTotal())
		const sorted = totals.sort((a, b) => b[1] - a[1])
		const topThree = sorted.slice(0, 3)
		return topThree
	}

	const topCats = topCategories()
	const topCatAmount = topCats[0]?.[1] || 1

	return (
		<div>
			<p className="font-heading font-semibold">{currMonthName}'s Spending</p>
			<Card className="overflow-visible shadow-card rounded-lg ring-0 mt-5">
				<CardHeader>
					<CardTitle className="text-xs! text-ink/70 font-sans">
						Total spent
					</CardTitle>
					<CardDescription>
						<p className="font-mono text-2xl! tracking-wider">
							${currMonthSpend}
						</p>
						<p className="text-xxs text-ink/70">
							Your biggest categories this month
						</p>
					</CardDescription>
					<CardAction className="text-right">
						<p className="text-xxs text-ink/70">vs last month</p>
						<p
							className={`${lastMonthCompare > 0 ? 'text-semantic-success' : 'text-semantic-danger'} font-mono font-semibold`}>
							{lastMonthCompare > 0 ? (
								<BiUpArrow className="inline" />
							) : (
								<BiDownArrow className="inline" />
							)}{' '}
							{lastMonthCompare}%
						</p>
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{topCats.map((cat, i) => (
						<Field key={i} className="w-full max-w-sm">
							<FieldLabel htmlFor="progress-upload">
								<span className="font-bold">{cat[0]}</span>
								<span className="text-ink/70 font-mono tracking-widest ml-auto">
									{formatAmount(cat[1])}
								</span>
							</FieldLabel>
							<Progress
								value={(cat[1] / topCatAmount) * 100}
								id="progress-upload"
								className="rounded-full"
							/>
						</Field>
					))}
				</CardContent>
			</Card>
		</div>
	)
}

export default MonthSpend

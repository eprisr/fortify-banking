'use client'

import {
	getCurrentMonthName,
	getTrailingMonthsYYYYMM,
	sumTransTotalsByMonth,
} from '@/lib/utils'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card'
import { type ChartConfig, ChartContainer } from './ui/chart'
import { Area, AreaChart, Tooltip, XAxis } from 'recharts'
import { BiDownArrow, BiUpArrow } from 'react-icons/bi'

const MonthSpend = ({ transactions = [] }: TransactionTableProps) => {
	const currMonthName = getCurrentMonthName()
	const lastYear = getTrailingMonthsYYYYMM()

	const monthlyTotal = () => {
		const totalsByMonth = lastYear.map((month) => {
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
				totals: sumTransTotalsByMonth(filteredTransactions, 'type', 'amount'),
			}
		})

		return totalsByMonth
	}

	const chartData = monthlyTotal()

	const chartConfig = {
		debit: {
			'label': 'Month',
			'color': 'var(--chart-gradient)',
		},
	} satisfies ChartConfig

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

	return (
		<Card className="overflow-visible shadow-card rounded-lg ring-0">
			<CardHeader>
				<CardTitle className="font-light uppercase text-10!">
					{currMonthName}'s Spending
				</CardTitle>
				<CardDescription className="font-bold text-24!">
					${currMonthSpend}
				</CardDescription>
				<CardAction>
					<p className="text-10">vs last month</p>
					<p
						className={`${lastMonthCompare > 0 ? 'text-green-500' : 'text-red-600'} font-bold`}>
						{lastMonthCompare > 0 ? (
							<BiUpArrow className="inline" />
						) : (
							<BiDownArrow className="inline" />
						)}{' '}
						{lastMonthCompare}%
					</p>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart accessibilityLayer data={chartData}>
						<defs>
							<linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#3629b7" stopOpacity={0.8} />
								<stop offset="95%" stopColor="#3629b7" stopOpacity={0} />
							</linearGradient>
						</defs>
						<Area
							type="monotone"
							dataKey="totals.debit"
							stroke="var(--color-primary-700)"
							fill="url(#colorDebit)"
							fillOpacity={1}
							isAnimationActive
						/>
						<XAxis dataKey="month" />
						<Tooltip />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

export default MonthSpend

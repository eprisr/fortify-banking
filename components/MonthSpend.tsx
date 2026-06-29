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
import { Bar, BarChart } from 'recharts'
import { useState } from 'react'
import { BiUpArrow } from 'react-icons/bi'

const MonthSpend = ({ transactions }: TransactionTableProps) => {
	const currMonth = getCurrentMonthName()
	const lastYear = getTrailingMonthsYYYYMM()

	const monthlyTotal = () => {
		const transactionsByMonth = lastYear.map((month) => {
			const [bucketYear, bucketMonth] = month.split('-').map(Number)
			return transactions.filter((trans) => {
				const tDate = new Date(trans.date)
				return (
					tDate.getMonth() + 1 === bucketMonth &&
					tDate.getFullYear() === bucketYear
				)
			})
		})

		const total = transactionsByMonth.map((trans) =>
			sumTransTotalsByMonth(trans, 'type', 'amount'),
		)

		return total
	}

	const chartData = monthlyTotal()

	const chartConfig = {
		debit: {
			'label': 'Month',
			'color': 'var(--color-gray-400)',
		},
	} satisfies ChartConfig

	return (
		<Card className="overflow-visible">
			<CardHeader>
				<CardTitle className="font-light uppercase text-10!">
					{currMonth}'s Spending
				</CardTitle>
				<CardDescription className="font-bold text-24!">
					${chartData[13].debit.toFixed(2)}
				</CardDescription>
				<CardAction>
					<p className="text-10">vs last month</p>
					<p className="text-green-500 font-bold">
						<BiUpArrow className="inline" /> 0%
					</p>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={chartData}>
						<Bar dataKey="debit" fill="var(--color-debit)" />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

export default MonthSpend

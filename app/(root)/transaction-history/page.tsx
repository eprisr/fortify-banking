import RecentTransactions from '@/components/RecentTransactions'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const TransactionHistory = async ({
	searchParams: { id, page },
}: SearchParamProps) => {
	const currentPage = Number(page as string) || 1
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn.$id })
	if (!accounts) return

	const accountsData = accounts?.data
	const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	const account = await getAccount({ appwriteItemId })

	console.log(account)

	return (
		<RecentTransactions
			accounts={accountsData}
			transactions={account?.transactions}
			appwriteItemId={appwriteItemId}
			page={currentPage}
		/>
	)
}

export default TransactionHistory

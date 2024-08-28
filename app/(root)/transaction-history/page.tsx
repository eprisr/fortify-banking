import Navbar from '@/components/Navbar'
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

	return (
		<>
			<Navbar type="sub" pageTitle="Transaction history" background />
			<section className="flex flex-col px-5 sm:px-6 py-5 lg:py-6 bg-white rounded-t-3xl min-h-[calc(100vh_-_152px)]">
				<RecentTransactions
					accounts={accountsData}
					transactions={account?.transactions}
					appwriteItemId={appwriteItemId}
					page={currentPage}
				/>
			</section>
		</>
	)
}

export default TransactionHistory

import Navbar from '@/components/Navbar'
import Transactions from '@/components/Transactions'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
	const { id, page } = await searchParams

	const currentPage = Number(page as string) || 1
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })
	if (!accounts) return

	const accountsData = accounts?.data
	const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	const account = await getAccount({ appwriteItemId })

	return (
		<>
			<Navbar type="sub" pageTitle="Transaction history" />
			<section className="flex flex-col px-5 sm:px-6 py-5 lg:py-6 bg-white min-h-[calc(100vh-152px)]">
				<Transactions
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

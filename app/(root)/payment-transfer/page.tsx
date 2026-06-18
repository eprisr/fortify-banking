import Navbar from '@/components/Navbar'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const Transfer = async () => {
	let loggedIn = null
	let accounts = null

	try {
		loggedIn = await getLoggedInUser()

		if (loggedIn) {
			accounts = await getAccounts({ userId: loggedIn.$id })
		}
	} catch (error) {
		console.error('Failed to fetch user or accounts:', error)
	}

	const accountsData = accounts?.data

	return (
		<>
			<Navbar type="sub" pageTitle="Transfer" />
			<section className="payment-transfer size-full">
				<PaymentTransferForm accounts={accountsData} />
			</section>
		</>
	)
}

export default Transfer

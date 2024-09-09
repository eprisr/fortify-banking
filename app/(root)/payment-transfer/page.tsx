import Navbar from '@/components/Navbar'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const Transfer = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn.$id })

	if (!accounts) return

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

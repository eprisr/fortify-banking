'use server'

import { ID, Query } from 'node-appwrite'
import { createAdminClient } from '../server/appwrite'
import { parseStringify } from '../utils'

const {
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
} = process.env

export const createTransaction = async (
	transaction: CreateTransactionProps,
) => {
	try {
		const { table } = await createAdminClient()

		const newTransaction = await table.createRow({
			databaseId: DATABASE_ID!,
			tableId: TRANSACTION_COLLECTION_ID!,
			rowId: ID.unique(),
			data: {
				channel: 'online',
				category: 'Transfer',
				...transaction,
			},
		})

		return parseStringify(newTransaction)
	} catch (error) {
		console.error('An Error Occured while Creating the Transaction', error)
	}
}

export const getTransactionsByBankId = async ({
	bankId,
}: getTransactionsByBankIdProps) => {
	try {
		const { table } = await createAdminClient()

		const senderTransactions = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: TRANSACTION_COLLECTION_ID!,
			queries: [Query.equal('senderBankId', bankId)],
		})

		const receiverTransactions = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: TRANSACTION_COLLECTION_ID!,
			queries: [Query.equal('receiverBankId', bankId)],
		})

		const transactions = {
			total: senderTransactions.total + receiverTransactions.total,
			documents: [...senderTransactions.rows, ...receiverTransactions.rows],
		}

		return parseStringify(transactions)
	} catch (error) {
		console.error('An Error Occured while Getting the Transactions', error)
	}
}

'use client'

import { useState } from 'react'
import { AccountFullCard } from './AccountFullCard'
import { AccountRow } from './AccountRow'

interface LinkedAccountsListProps {
	accounts: Account[]
}

export const LinkedAccountsList = ({ accounts }: LinkedAccountsListProps) => {
	const [selectedId, setSelectedId] = useState<string | null>(null)

	return (
		<div className="flex flex-col gap-3">
			{accounts.map((account) =>
				account.appwriteItemId === selectedId ? (
					<AccountFullCard
						key={account.appwriteItemId}
						account={account}
						onCollapse={() => setSelectedId(null)}
					/>
				) : (
					<AccountRow
						key={account.appwriteItemId}
						account={account}
						onSelect={() => setSelectedId(account.appwriteItemId)}
					/>
				),
			)}
		</div>
	)
}

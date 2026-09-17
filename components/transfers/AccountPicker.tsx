'use client'

import { ChevronRight, Landmark, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

import { findRecipientByEmail } from '@/lib/actions/user.actions'
import { formatAmount } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type Destination =
	| { kind: 'account'; account: Account }
	| { kind: 'recipient'; recipient: Recipient; email: string }

interface AccountPickerProps {
	mode: 'from' | 'to'
	label: string
	accounts: Account[]
	excludeAccountId?: string
	value: Destination | null
	onChange: (destination: Destination) => void
}

const initials = (name: string) =>
	name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()

export const AccountPicker = ({
	mode,
	label,
	accounts,
	excludeAccountId,
	value,
	onChange,
}: AccountPickerProps) => {
	const [open, setOpen] = useState(false)
	const [email, setEmail] = useState('')
	const [searching, setSearching] = useState(false)
	const [searchError, setSearchError] = useState('')
	const [found, setFound] = useState<Recipient | null>(null)
	const [manualMode, setManualMode] = useState(false)
	const [manualName, setManualName] = useState('')
	const [manualEmail, setManualEmail] = useState('')
	const [manualId, setManualId] = useState('')

	const otherAccounts = accounts.filter(
		(account) => account.appwriteItemId !== excludeAccountId,
	)

	const reset = () => {
		setEmail('')
		setFound(null)
		setSearchError('')
		setManualMode(false)
		setManualName('')
		setManualEmail('')
		setManualId('')
	}

	const select = (destination: Destination) => {
		onChange(destination)
		setOpen(false)
		reset()
	}

	const search = async () => {
		if (!email.trim()) return
		setSearching(true)
		setSearchError('')
		setFound(null)
		const res = await findRecipientByEmail(email.trim())
		setSearching(false)
		if (!res.success) {
			setSearchError(res.error)
			return
		}
		setFound(res.data)
	}

	const rowLabel = !value
		? label
		: value.kind === 'account'
			? value.account.name
			: value.recipient.name

	const rowSublabel = !value
		? ''
		: value.kind === 'account'
			? `${formatAmount(value.account.currentBalance)} available`
			: 'Fortify user'

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) reset()
			}}>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full items-center gap-3 rounded-2xl bg-muted px-4 py-3.5 text-left">
				<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
					{value?.kind === 'recipient' ? (
						<UserIcon className="size-4" />
					) : (
						<Landmark className="size-4" />
					)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-sm font-bold text-foreground">
						{rowLabel}
					</span>
					{rowSublabel && (
						<span className="block font-mono text-xs text-muted-foreground">
							{rowSublabel}
						</span>
					)}
				</span>
				<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
			</button>

			<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>{mode === 'from' ? 'Send from' : 'Send to'}</SheetTitle>
				</SheetHeader>

				<div className="flex flex-col gap-1 px-4 pb-2">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Your accounts
					</p>
					{otherAccounts.length === 0 && (
						<p className="px-1 py-2 text-xs text-muted-foreground">
							{mode === 'from'
								? 'No linked accounts yet.'
								: 'Link another account to transfer between your own accounts.'}
						</p>
					)}
					{otherAccounts.map((account) => (
						<button
							key={account.appwriteItemId}
							type="button"
							onClick={() => select({ kind: 'account', account })}
							className="flex items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted">
							<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
								<Landmark className="size-4" />
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-sm font-bold text-foreground">
									{account.name}
								</span>
								<span className="block font-mono text-xs text-muted-foreground">
									{formatAmount(account.currentBalance)} available
								</span>
							</span>
						</button>
					))}
				</div>

				{mode === 'to' && (
					<div className="flex flex-col gap-2 px-4 pt-2 pb-4">
						<div className="flex items-center justify-between">
							<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Send to a person
							</p>
							<button
								type="button"
								onClick={() => setManualMode((prev) => !prev)}
								className="text-xs font-medium text-primary hover:underline">
								{manualMode ? 'Search by email instead' : 'Have a shareable ID?'}
							</button>
						</div>

						{manualMode ? (
							<div className="flex flex-col gap-2">
								<Input
									placeholder="Recipient's name"
									value={manualName}
									onChange={(e) => setManualName(e.target.value)}
								/>
								<Input
									placeholder="Recipient's email"
									value={manualEmail}
									onChange={(e) => setManualEmail(e.target.value)}
								/>
								<Input
									placeholder="Recipient's shareable ID"
									value={manualId}
									onChange={(e) => setManualId(e.target.value)}
								/>
								<Button
									type="button"
									disabled={!manualName.trim() || !manualEmail.trim() || !manualId.trim()}
									onClick={() =>
										select({
											kind: 'recipient',
											recipient: {
												name: manualName.trim(),
												shareableId: manualId.trim(),
											},
											email: manualEmail.trim(),
										})
									}>
									Use this recipient
								</Button>
							</div>
						) : (
							<>
								<div className="flex gap-2">
									<Input
										placeholder="Their email address"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												search()
											}
										}}
									/>
									<Button
										type="button"
										onClick={search}
										disabled={searching || !email.trim()}>
										{searching ? 'Searching…' : 'Find'}
									</Button>
								</div>
								{searchError && (
									<p className="text-xs font-medium text-destructive">{searchError}</p>
								)}
								{found && (
									<button
										type="button"
										onClick={() =>
											select({ kind: 'recipient', recipient: found, email: email.trim() })
										}
										className="flex items-center gap-3 rounded-xl bg-muted px-3 py-3 text-left">
										<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
											{initials(found.name)}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-bold text-foreground">
												{found.name}
											</span>
											<span className="block text-xs text-muted-foreground">
												Fortify user
											</span>
										</span>
									</button>
								)}
							</>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

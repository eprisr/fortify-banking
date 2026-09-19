'use client'

import { ChevronRight, CreditCard, Plus, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
	findRecipientByEmail,
	getRecentRecipients,
} from '@/lib/actions/user.actions'
import { cn, formatAmount } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { useMobileContainer } from '@/components/mobile-container'

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
	const container = useMobileContainer()
	const [open, setOpen] = useState(false)
	const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>(
		[],
	)
	const [addPanelOpen, setAddPanelOpen] = useState(false)
	const [email, setEmail] = useState('')
	const [searching, setSearching] = useState(false)
	const [searchError, setSearchError] = useState('')
	const [found, setFound] = useState<Recipient | null>(null)
	const [manualMode, setManualMode] = useState(false)
	const [manualName, setManualName] = useState('')
	const [manualEmail, setManualEmail] = useState('')
	const [manualId, setManualId] = useState('')

	useEffect(() => {
		if (mode !== 'to') return
		getRecentRecipients().then((res) => {
			if (res.success) setRecentRecipients(res.data)
		})
	}, [mode])

	const reset = () => {
		setAddPanelOpen(false)
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
						<CreditCard className="size-4" />
					)}
				</span>
				<span className="min-w-0 flex-1">
					<span
						className={cn(
							'block truncate text-sm font-bold text-foreground',
							value?.kind === 'recipient' && 'font-serif',
						)}>
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

			<SheetContent
				side="bottom"
				container={container}
				className="bg-paper rounded-t-2xl max-h-[85vh] overflow-y-auto">
				<SheetHeader className="pt-6 px-6 pb-4">
					<SheetTitle className="text-base font-bold">
						{mode === 'from' ? 'Send from' : 'Send to'}
					</SheetTitle>
				</SheetHeader>

				<div className="flex flex-col gap-1 px-6 pb-7">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Your accounts
					</p>
					{accounts.map((account) => {
						const disabled = account.appwriteItemId === excludeAccountId
						return (
							<button
								key={account.appwriteItemId}
								type="button"
								disabled={disabled}
								onClick={() => select({ kind: 'account', account })}
								className={cn(
									'flex items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted',
									disabled && 'pointer-events-none opacity-40',
								)}>
								<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
									<CreditCard className="size-4" />
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
						)
					})}
				</div>

				{mode === 'to' && (
					<div className="flex flex-col gap-3 px-4 pt-2 pb-4">
						<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							People
						</p>
						<div className="flex gap-4 overflow-x-auto pb-1">
							<button
								type="button"
								onClick={() => setAddPanelOpen((prev) => !prev)}
								className="flex shrink-0 flex-col items-center gap-1.5">
								<span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
									<Plus className="size-5" />
								</span>
								<span className="text-xs font-semibold text-foreground">
									Add new
								</span>
							</button>
							{recentRecipients.map((recipient) => (
								<button
									key={recipient.shareableId}
									type="button"
									onClick={() =>
										select({
											kind: 'recipient',
											recipient: {
												name: recipient.name,
												shareableId: recipient.shareableId,
											},
											email: recipient.email,
										})
									}
									className="flex shrink-0 flex-col items-center gap-1.5">
									<span className="flex size-14 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
										{initials(recipient.name)}
									</span>
									<span className="max-w-14 truncate font-serif text-xs font-semibold text-foreground">
										{recipient.name.split(' ')[0]}
									</span>
								</button>
							))}
						</div>

						{addPanelOpen && (
							<div className="flex flex-col gap-2 rounded-2xl bg-muted p-4">
								<div className="flex items-center justify-between">
									<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
										Add a recipient
									</p>
									<button
										type="button"
										onClick={() => setManualMode((prev) => !prev)}
										className="text-xs font-medium text-primary hover:underline">
										{manualMode
											? 'Search by email instead'
											: 'Have a shareable ID?'}
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
											disabled={
												!manualName.trim() ||
												!manualEmail.trim() ||
												!manualId.trim()
											}
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
											<p className="text-xs font-medium text-destructive">
												{searchError}
											</p>
										)}
										{found && (
											<button
												type="button"
												onClick={() =>
													select({
														kind: 'recipient',
														recipient: found,
														email: email.trim(),
													})
												}
												className="flex items-center gap-3 rounded-xl bg-background px-3 py-3 text-left">
												<span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
													{initials(found.name)}
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate font-serif text-sm font-bold text-foreground">
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
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

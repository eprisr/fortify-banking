'use client'

import { ChevronRight, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMobileContainer } from '@/components/mobile-container'

interface AccountOptionsSheetProps {
	account: Account
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const AccountOptionsSheet = ({
	account,
	open,
	onOpenChange,
}: AccountOptionsSheetProps) => {
	const container = useMobileContainer()

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				container={container}
				className="rounded-t-2xl bg-paper">
				<SheetHeader className="px-6 pt-6 pb-2">
					<SheetTitle className="text-lg font-bold">{account.name}</SheetTitle>
				</SheetHeader>

				<div className="flex flex-col px-6 pb-6">
					<button
						type="button"
						className="flex items-center justify-between gap-3 py-3.5 text-left">
						<span className="flex items-center gap-3">
							<RefreshCw className="size-4.5 shrink-0 text-foreground" />
							<span>
								<span className="block text-sm font-semibold text-foreground">
									Relink account
								</span>
								<span className="block text-xs text-muted-foreground">
									Refresh the connection through Plaid
								</span>
							</span>
						</span>
						<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
					</button>

					<button
						type="button"
						className="flex items-center justify-between gap-3 py-3.5 text-left">
						<span className="flex items-center gap-3">
							<Pencil className="size-4.5 shrink-0 text-foreground" />
							<span>
								<span className="block text-sm font-semibold text-foreground">
									Rename account
								</span>
								<span className="block text-xs text-muted-foreground">
									Change what you call this in Fortify
								</span>
							</span>
						</span>
						<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
					</button>

					<div className="my-2 border-t border-foreground/10" />

					<button
						type="button"
						className="flex items-center gap-3 py-3.5 text-left">
						<Trash2 className="size-4.5 shrink-0 text-destructive" />
						<span>
							<span className="block text-sm font-semibold text-destructive">
								Remove account
							</span>
							<span className="block text-xs text-muted-foreground">
								Unlink this account from Fortify
							</span>
						</span>
					</button>

					<Button
						type="button"
						variant="secondary"
						className="mt-4 h-auto w-full rounded-2xl py-3.5"
						onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}

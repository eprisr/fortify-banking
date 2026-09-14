'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { disableMFA } from '@/lib/actions/user.actions'
import { useMobileContainer } from '@/components/mobile-container'

const TwoFactorDisableControl = () => {
	const router = useRouter()
	const container = useMobileContainer()

	const handleConfirm = () => {
		disableMFA().then((result) => {
			if (result.success) {
				router.refresh()
			} else {
				toast.error(result.error)
			}
		})
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger className="cursor-pointer appearance-none border-none bg-transparent p-0 text-xs font-semibold text-semantic-success">
				On
			</AlertDialogTrigger>
			<AlertDialogContent
				container={container}
				position="bottom"
				className="font-sans">
				<AlertDialogHeader className="text-left">
					<AlertDialogTitle className="text-xl font-bold text-ink">
						Turn off two-factor authentication?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-ink/70">
						You&apos;ll no longer be asked for a recovery code when signing in
						or making transfers. You can turn it back on any time, but
						you&apos;ll need to generate new recovery codes to do so.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col sm:flex-col sm:justify-stretch">
					<AlertDialogCancel className="w-full rounded-xl border-transparent bg-primary py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/80">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className="w-full rounded-xl bg-cloud py-4 text-sm font-semibold text-ink hover:bg-cloud/70">
						Turn off
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default TwoFactorDisableControl

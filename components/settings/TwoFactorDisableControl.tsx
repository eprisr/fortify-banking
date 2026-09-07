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

const TwoFactorDisableControl = ({ userId }: { userId: string }) => {
	const router = useRouter()

	const handleConfirm = () => {
		disableMFA(userId).then((result) => {
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
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Turn off two-factor authentication?
					</AlertDialogTitle>
					<AlertDialogDescription>
						You&apos;ll no longer be asked for a recovery code when signing in
						or making transfers. You can turn it back on any time, but
						you&apos;ll need to generate new recovery codes to do so.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className="bg-destructive/10 text-destructive hover:bg-destructive/20">
						Turn off
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default TwoFactorDisableControl

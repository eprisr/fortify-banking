'use client'

import { ChevronLeft, Moon, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface NotificationsListProps {
	showMfaNotification: boolean
}

export const NotificationsList = ({
	showMfaNotification,
}: NotificationsListProps) => {
	const router = useRouter()
	const [mfaUnread, setMfaUnread] = useState(showMfaNotification)

	return (
		<div className="flex flex-col gap-4">
			<button
				type="button"
				aria-label="Go back"
				onClick={() => router.back()}
				className="flex size-8 items-center justify-center rounded-full bg-cloud">
				<ChevronLeft size={12} />
			</button>

			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-foreground">Notifications</h1>
				{showMfaNotification && (
					<button
						type="button"
						onClick={() => setMfaUnread(false)}
						className="text-sm font-semibold text-primary">
						Mark all as read
					</button>
				)}
			</div>

			{showMfaNotification && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						New
					</p>
					<div className="relative flex gap-3 rounded-2xl bg-muted p-4">
						{mfaUnread && (
							<span className="absolute top-4 right-4 size-2 rounded-full bg-destructive" />
						)}
						<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-plum-tint text-primary">
							<Shield className="size-5" />
						</span>
						<div className="flex flex-col gap-2 pr-4">
							<div>
								<p className="text-sm font-bold text-foreground">
									Add extra security to your account
								</p>
								<p className="text-sm text-muted-foreground">
									Turn on two-factor authentication to help protect transfers
									and other sensitive actions.
								</p>
							</div>
							<p className="text-xs text-muted-foreground">2 days ago</p>
							<Button asChild className="w-fit rounded-full px-5">
								<Link href="/settings">Turn on</Link>
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-2">
				<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Earlier
				</p>
				<div className="flex gap-3 rounded-2xl bg-muted p-4">
					<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
						<Moon className="size-5" />
					</span>
					<div className="flex flex-col gap-1">
						<p className="text-sm font-bold text-foreground">
							Welcome to Fortify
						</p>
						<p className="text-sm text-muted-foreground">
							Here&apos;s a quick look at what you can do first.
						</p>
						<p className="text-xs text-muted-foreground">5 days ago</p>
					</div>
				</div>
			</div>

			<Link
				href="/notifications/preferences"
				className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary">
				<Settings className="size-4" />
				Manage notification preferences
			</Link>
		</div>
	)
}

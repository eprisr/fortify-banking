'use client'

import { Bell, ChevronLeft, Moon, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { markAllNotificationsRead } from '@/lib/actions/notification.actions'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NotificationsListProps {
	notifications: AppNotification[]
}

const iconForType = (type: string) => {
	switch (type) {
		case 'welcome':
			return { Icon: Moon, badgeClass: 'bg-gold/15 text-gold' }
		case 'security_mfa':
			return { Icon: Shield, badgeClass: 'bg-plum-tint text-primary' }
		default:
			return { Icon: Bell, badgeClass: 'bg-accent text-accent-foreground' }
	}
}

export const NotificationsList = ({ notifications }: NotificationsListProps) => {
	const router = useRouter()
	const [isMarking, setIsMarking] = useState(false)

	const unread = notifications.filter((n) => !n.read)
	const read = notifications.filter((n) => n.read)

	const handleMarkAllRead = async () => {
		setIsMarking(true)
		await markAllNotificationsRead()
		setIsMarking(false)
		router.refresh()
	}

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
				{unread.length > 0 && (
					<button
						type="button"
						disabled={isMarking}
						onClick={handleMarkAllRead}
						className="text-sm font-semibold text-primary disabled:opacity-50">
						Mark all as read
					</button>
				)}
			</div>

			{unread.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						New
					</p>
					{unread.map((notification) => (
						<NotificationRow key={notification.$id} notification={notification} unread />
					))}
				</div>
			)}

			{read.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Earlier
					</p>
					{read.map((notification) => (
						<NotificationRow key={notification.$id} notification={notification} />
					))}
				</div>
			)}

			<Link
				href="/notifications/preferences"
				className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary">
				<Settings className="size-4" />
				Manage notification preferences
			</Link>
		</div>
	)
}

const NotificationRow = ({
	notification,
	unread = false,
}: {
	notification: AppNotification
	unread?: boolean
}) => {
	const { Icon, badgeClass } = iconForType(notification.type)

	return (
		<div className="relative flex gap-3 rounded-2xl bg-muted p-4">
			{unread && (
				<span className="absolute top-4 right-4 size-2 rounded-full bg-destructive" />
			)}
			<span
				className={`flex size-10 shrink-0 items-center justify-center rounded-full ${badgeClass}`}>
				<Icon className="size-5" />
			</span>
			<div className="flex flex-col gap-2 pr-4">
				<div>
					<p className="text-sm font-bold text-foreground">{notification.title}</p>
					<p className="text-sm text-muted-foreground">{notification.body}</p>
				</div>
				<p className="text-xs text-muted-foreground">
					{formatRelativeTime(notification.$createdAt)}
				</p>
				{notification.actionHref && notification.actionLabel && (
					<Button asChild className="w-fit rounded-full px-5">
						<Link href={notification.actionHref}>
							{notification.actionLabel}
						</Link>
					</Button>
				)}
			</div>
		</div>
	)
}

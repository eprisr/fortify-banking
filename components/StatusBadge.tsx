import { Badge } from '@/components/ui/badge'
import { FeatureStatus, statusConfig } from '@/lib/feature-status'

interface StatusBadgeProps {
	status: FeatureStatus
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
	const config = statusConfig[status]

	return (
		<Badge
			className={`text-xxs! font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 ml-2 align-middle ${config.className}`}>
			{config.label}
		</Badge>
	)
}

export default StatusBadge

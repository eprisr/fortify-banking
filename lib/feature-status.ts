export type FeatureStatus = 'live' | 'in-progress' | 'planned'

interface Status {
	label: string
	className: string
}

export const statusConfig: Record<FeatureStatus, Status> = {
	live: {
		label: 'Live',
		className:
			'bg-sage-decorative/15 text-sage border border-sage-decorative/30',
	},
	'in-progress': {
		label: 'In progress',
		className:
			'bg-gold-decorative/15 text-gold border border-gold-decorative/30',
	},
	planned: {
		label: 'Planned',
		className: 'bg-cloud text-ink/60 border border-ink/15',
	},
}

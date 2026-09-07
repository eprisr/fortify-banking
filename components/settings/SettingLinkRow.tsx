import { ChevronRight } from 'lucide-react'
import SettingRowShell from './SettingRowShell'

const SettingLinkRow = ({ item }: { item: Extract<SettingItem, { kind: 'link' }> }) => {
	return (
		<SettingRowShell
			Icon={item.Icon}
			label={item.label}
			subText={item.subText}
			href={item.route}>
			<ChevronRight size={16} className="text-ink/30" />
		</SettingRowShell>
	)
}

export default SettingLinkRow

import SettingRowShell from './SettingRowShell'
import SettingToggleControl from './SettingToggleControl'

const SettingToggleRow = ({
	item,
	checked,
}: {
	item: Extract<SettingItem, { kind: 'toggle' }>
	checked: boolean
}) => {
	return (
		<SettingRowShell Icon={item.Icon} label={item.label} subText={item.subText}>
			<SettingToggleControl checked={checked} />
		</SettingRowShell>
	)
}

export default SettingToggleRow

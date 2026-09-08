import SettingRowShell from './SettingRowShell'
import TwoFactorDisableControl from './TwoFactorDisableControl'

const SettingStatusRow = ({
	item,
	user,
}: {
	item: Extract<SettingItem, { kind: 'status' }>
	user: Record<string, any>
}) => {
	const on = !!user[item.deps]

	if (on && item.key === 'twoFactor') {
		return (
			<SettingRowShell
				Icon={item.Icon}
				label={item.label}
				subText={item.subText}>
				<TwoFactorDisableControl />
			</SettingRowShell>
		)
	}

	return (
		<SettingRowShell
			Icon={item.Icon}
			label={item.label}
			subText={item.subText}
			href={item.route}>
			<p
				className={`text-xs font-semibold ${on ? 'text-semantic-success' : 'text-semantic-danger'}`}>
				{on ? 'On' : 'Off'}
			</p>
		</SettingRowShell>
	)
}

export default SettingStatusRow

import { Fragment } from 'react'
import HeaderBox from '@/components/shared/HeaderBox'
import { settings } from '@/constants'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import SettingLinkRow from '@/components/settings/SettingLinkRow'
import SettingStatusRow from '@/components/settings/SettingStatusRow'
import SettingToggleRow from '@/components/settings/SettingToggleRow'

const Settings = async () => {
	const user = await getLoggedInUser()
	const links = Object.groupBy(settings, ({ category }) => category)

	return (
		<>
			<section>
				<HeaderBox title="Security & Privacy" subtext="" />
				{Object.entries(links).map(([key, value], i) => (
					<Fragment key={i}>
						<h3 className="text-xxs text-gray-400 font-semibold mt-6">
							{key.toUpperCase()}
						</h3>
						{value?.map((item) => {
							switch (item.kind) {
								case 'link':
									return <SettingLinkRow key={item.label} item={item} />
								case 'status':
									return (
										<SettingStatusRow key={item.label} item={item} user={user} />
									)
								case 'toggle':
									return (
										<SettingToggleRow
											key={item.label}
											item={item}
											checked={item.deps ? !!user[item.deps] : false}
										/>
									)
							}
						})}
					</Fragment>
				))}
			</section>
		</>
	)
}

export default Settings

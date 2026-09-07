'use client'

import { Switch } from '@/components/ui/switch'

const SettingToggleControl = ({ checked }: { checked: boolean }) => {
	return <Switch checked={checked} disabled />
}

export default SettingToggleControl

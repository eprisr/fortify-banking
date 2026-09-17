import { generateRecoveryCodes, getLoggedInUser } from '@/lib/actions/user.actions'
import VerifyEmail from '@/components/auth/VerifyEmail'
import { obscureEmail } from '@/lib/utils'
import RecoveryCodesFlow from '@/components/settings/RecoveryCodesFlow'

const Settings = async () => {
	const user = await getLoggedInUser()
	const { verifiedEmail } = user
	const email = obscureEmail(user.email)

	if (!verifiedEmail) {
		return <VerifyEmail email={email} />
	}

	// Only ever call this once we know the user can actually see/use the
	// result — Appwrite's recovery codes are precious (one-time create,
	// otherwise a regenerate), so don't burn a call on a user who's about to
	// be shown the verify-email prompt instead.
	const result = await generateRecoveryCodes()

	return <RecoveryCodesFlow initialResult={result} />
}

export default Settings

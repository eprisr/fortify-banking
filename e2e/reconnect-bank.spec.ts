import { expect, test } from '@playwright/test'
import { deleteTestUser } from './support/appwrite-admin'
import { forceItemLoginRequired } from './support/plaid-sandbox'
import { signUpAndLinkBank } from './support/test-user'

// Closes the "untested update-mode path" gap in plaid_oauth_status: the
// reconnect/relink flow was previously unbuildable to test at all —
// PlaidLinkProps had no way to receive a specific bank's access token, so
// createLinkToken's update-mode branch always ran with an undefined
// access_token, silently producing a plain (non-update) Link session no
// matter what. Fixed in bank.actions.ts (getAccounts now surfaces which
// bank needs reconnecting), user.actions.ts (createLinkToken resolves the
// access token server-side from appwriteItemId — never trusts one from the
// client), PlaidLink.tsx, and the home page. See component_fixes_deferred.
//
// This forces a real Item into ITEM_LOGIN_REQUIRED via Plaid's documented
// /sandbox/item/reset_login (plaid-sandbox.ts), then verifies the real home
// page detects it and offers a working reconnect session. Doesn't drive
// Plaid Link's actual re-auth UI past that — same "don't automate Link's
// UI" reasoning as connect-bank.spec.ts (Plaid's own recommendation); the
// exact update-mode request body (right access_token reaching Plaid) is
// already precisely covered by __tests__/actions/user.actions.linktoken.test.ts.
test('a bank that needs re-auth shows a working reconnect prompt on the dashboard', async ({
	page,
}) => {
	const { email, bank } = await signUpAndLinkBank(page)

	try {
		await forceItemLoginRequired(bank.accessToken)

		await page.goto('/')

		await expect(page.getByText('Bank connection needs attention')).toBeVisible()
		await expect(
			page.getByText('Reconnect your bank to keep your data current.'),
		).toBeVisible()

		const reconnectButton = page.getByRole('button', { name: 'Connect' })
		await expect(reconnectButton).toBeEnabled()
		await reconnectButton.click()

		// A real, valid update-mode link_token was issued and Link actually
		// initialized with it — createLinkToken didn't silently fail (which,
		// before this fix, it structurally couldn't have avoided: no access
		// token ever reached it for a specific bank).
		await expect(page.locator('iframe[title="Plaid Link"]')).toBeVisible()
	} finally {
		await deleteTestUser(email)
	}
})

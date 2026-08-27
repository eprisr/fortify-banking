import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { Products } from 'plaid'
import { plaidClient } from '@/lib/plaid'

/**
 * https://plaid.com/docs/sandbox/
 *
 * Verified ins_109508 is really "First Platypus Bank" via a real
 * institutionsGetById call before relying on it here. */
export async function createSandboxPublicToken(institutionId = 'ins_109508') {
	const res = await plaidClient.sandboxPublicTokenCreate({
		institution_id: institutionId,
		initial_products: ['auth'] as Products[],
	})
	return res.data.public_token
}

/** Plaid's documented way to test the update-mode Link flow in Sandbox:
 * forces a real Item into ITEM_LOGIN_REQUIRED, the same state a real
 * expired/revoked login would leave it in.
 * https://plaid.com/docs/sandbox/ */
export async function forceItemLoginRequired(accessToken: string) {
	await plaidClient.sandboxItemResetLogin({ access_token: accessToken })
}

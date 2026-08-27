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

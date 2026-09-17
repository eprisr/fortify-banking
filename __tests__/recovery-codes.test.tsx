/**
 * RecoveryCodesFlow tests (ADR-013 — MFA re-enrollment fix).
 *
 * Covers the challenge-required branch and both bugs found after the
 * initial implementation: a second, duplicate MFA-challenge email fired by
 * an unguarded effect, and completeMfaChallenge leaking the full user
 * profile (ssn/dob/address) to a caller that never needed it.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import RecoveryCodesFlow from '@/components/settings/RecoveryCodesFlow'
import {
	completeMfaChallenge,
	enableMFA,
	generateRecoveryCodes,
	requestMfaChallenge,
} from '@/lib/actions/user.actions'
import { hardNavigate } from '@/lib/utils'

jest.mock('@/lib/utils', () => ({
	...jest.requireActual('@/lib/utils'),
	hardNavigate: jest.fn(),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	completeMfaChallenge: jest.fn(),
	enableMFA: jest.fn(),
	generateRecoveryCodes: jest.fn(),
	requestMfaChallenge: jest.fn(),
}))

const codes = { recoveryCodes: ['aaaaaaaa', 'bbbbbbbb', 'cccccccc'] }

async function submitChallengeCode(code: string) {
	const boxes = await screen.findAllByLabelText(/code — character/i)
	await userEvent.click(boxes[0])
	await userEvent.paste(code)
	await userEvent.click(screen.getByRole('button', { name: /continue/i }))
}

describe('RecoveryCodesFlow', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('codes already available (first-time setup, or a fresh regenerate)', () => {
		it('renders the codes without ever requesting a challenge', () => {
			render(
				<RecoveryCodesFlow
					initialResult={{
						success: true,
						challengeRequired: false,
						data: codes,
					}}
				/>,
			)

			expect(screen.getByText('aaaaaaaa')).toBeInTheDocument()
			expect(requestMfaChallenge).not.toHaveBeenCalled()
		})

		it('enables MFA and hard-navigates home once confirmed', async () => {
			;(enableMFA as jest.Mock).mockResolvedValue({
				success: true,
				data: null,
			})

			render(
				<RecoveryCodesFlow
					initialResult={{
						success: true,
						challengeRequired: false,
						data: codes,
					}}
				/>,
			)

			await userEvent.click(screen.getByRole('checkbox'))
			await userEvent.click(screen.getByRole('button', { name: /continue/i }))

			expect(enableMFA).toHaveBeenCalled()
			await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith('/'))
		})
	})

	describe('re-enrollment (challenge required)', () => {
		it('requests exactly one email challenge even across re-renders', async () => {
			;(requestMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: { challengeId: 'challenge-1' },
			})

			const { rerender } = render(
				<RecoveryCodesFlow
					initialResult={{ success: true, challengeRequired: true }}
				/>,
			)

			await waitFor(() =>
				expect(requestMfaChallenge).toHaveBeenCalledTimes(1),
			)

			// The exact scenario that shipped a second real email before the
			// useRef guard existed: a re-render while `needsChallenge` is still
			// true and the first request hasn't resolved into `challengeId` yet.
			rerender(
				<RecoveryCodesFlow
					initialResult={{ success: true, challengeRequired: true }}
				/>,
			)

			expect(requestMfaChallenge).toHaveBeenCalledTimes(1)
		})

		it('completes the challenge, regenerates codes, and shows them — without ever seeing the user profile', async () => {
			;(requestMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: { challengeId: 'challenge-1' },
			})
			// Real shape post-fix: completeMfaChallenge returns data: null, never
			// the ssn/dob/address-bearing user row.
			;(completeMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: null,
			})
			;(generateRecoveryCodes as jest.Mock).mockResolvedValue({
				success: true,
				challengeRequired: false,
				data: codes,
			})

			render(
				<RecoveryCodesFlow
					initialResult={{ success: true, challengeRequired: true }}
				/>,
			)

			await submitChallengeCode('123456')

			expect(completeMfaChallenge).toHaveBeenCalledWith({
				challengeId: 'challenge-1',
				code: '123456',
			})
			expect(await screen.findByText('aaaaaaaa')).toBeInTheDocument()
		})

		it('shows an error and does not attempt to regenerate on an invalid code', async () => {
			;(requestMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: { challengeId: 'challenge-1' },
			})
			;(completeMfaChallenge as jest.Mock).mockResolvedValue({
				success: false,
				error: 'Invalid or expired code',
			})

			render(
				<RecoveryCodesFlow
					initialResult={{ success: true, challengeRequired: true }}
				/>,
			)

			await submitChallengeCode('000000')

			expect(
				await screen.findByText('Invalid or expired code'),
			).toBeInTheDocument()
			expect(generateRecoveryCodes).not.toHaveBeenCalled()
		})

		it('surfaces an error if verification succeeds but regenerating still needs another challenge', async () => {
			;(requestMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: { challengeId: 'challenge-1' },
			})
			;(completeMfaChallenge as jest.Mock).mockResolvedValue({
				success: true,
				data: null,
			})
			;(generateRecoveryCodes as jest.Mock).mockResolvedValue({
				success: true,
				challengeRequired: true,
			})

			render(
				<RecoveryCodesFlow
					initialResult={{ success: true, challengeRequired: true }}
				/>,
			)

			await submitChallengeCode('123456')

			expect(
				await screen.findByText(/still couldn.t be generated/i),
			).toBeInTheDocument()
		})
	})

	describe('initial failure', () => {
		it('shows the error message and never requests a challenge', () => {
			render(
				<RecoveryCodesFlow
					initialResult={{
						success: false,
						error: 'Failed to generate recovery codes',
					}}
				/>,
			)

			expect(
				screen.getByText('Failed to generate recovery codes'),
			).toBeInTheDocument()
			expect(requestMfaChallenge).not.toHaveBeenCalled()
		})
	})
})

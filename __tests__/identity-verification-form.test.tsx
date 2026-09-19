import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { IdentityVerificationForm } from '@/components/transfers/IdentityVerificationForm'
import { verifyIdentity } from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	verifyIdentity: jest.fn(),
}))

async function fillValidFields() {
	await userEvent.type(screen.getByPlaceholderText('Street address'), '99-99 33rd St')
	await userEvent.type(screen.getByPlaceholderText('City'), 'Jackson Heights')
	await userEvent.type(screen.getByPlaceholderText('State'), 'ny')
	await userEvent.type(screen.getByPlaceholderText('ZIP'), '11372')
	const dob = document.querySelector('input[type="date"]') as HTMLInputElement
	await userEvent.type(dob, '1990-01-01')
}

describe('IdentityVerificationForm', () => {
	const onVerified = jest.fn()
	const onCancel = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()
		render(<IdentityVerificationForm onVerified={onVerified} onCancel={onCancel} />)
	})

	it('shows a validation error and does not call verifyIdentity when required fields are empty', async () => {
		await userEvent.click(screen.getByRole('button', { name: /verify identity/i }))
		expect(
			await screen.findByText(/enter a valid street address/i),
		).toBeInTheDocument()
		expect(verifyIdentity).not.toHaveBeenCalled()
	})

	it('asks for the last 4 digits of the SSN on the first attempt', () => {
		expect(screen.getByText(/last 4 digits of your ssn/i)).toBeInTheDocument()
	})

	it('submits with a last-4 SSN and calls onVerified when Dwolla returns verified', async () => {
		;(verifyIdentity as jest.Mock).mockResolvedValue({
			success: true,
			data: { status: 'verified' },
		})
		await fillValidFields()
		await userEvent.type(screen.getByPlaceholderText('Last 4 digits of SSN'), '1234')
		await userEvent.click(screen.getByRole('button', { name: /verify identity/i }))

		await waitFor(() =>
			expect(verifyIdentity).toHaveBeenCalledWith(
				expect.objectContaining({ ssn: '1234', state: 'NY' }),
			),
		)
		await waitFor(() => expect(onVerified).toHaveBeenCalled())
	})

	it('switches to asking for the full SSN when Dwolla returns retry, without calling onVerified', async () => {
		;(verifyIdentity as jest.Mock).mockResolvedValue({
			success: true,
			data: { status: 'retry' },
		})
		await fillValidFields()
		await userEvent.type(screen.getByPlaceholderText('Last 4 digits of SSN'), '1234')
		await userEvent.click(screen.getByRole('button', { name: /verify identity/i }))

		expect(
			await screen.findByText(/full social security number/i),
		).toBeInTheDocument()
		expect(onVerified).not.toHaveBeenCalled()
	})

	it('shows a blocking message and offers a way back when Dwolla returns suspended', async () => {
		;(verifyIdentity as jest.Mock).mockResolvedValue({
			success: true,
			data: { status: 'suspended' },
		})
		await fillValidFields()
		await userEvent.type(screen.getByPlaceholderText('Last 4 digits of SSN'), '1234')
		await userEvent.click(screen.getByRole('button', { name: /verify identity/i }))

		expect(
			await screen.findByText(/could not be verified/i),
		).toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /back/i }))
		expect(onCancel).toHaveBeenCalled()
	})

	it('shows the server error message when verifyIdentity fails outright', async () => {
		;(verifyIdentity as jest.Mock).mockResolvedValue({
			success: false,
			error: 'Invalid SSN',
		})
		await fillValidFields()
		await userEvent.type(screen.getByPlaceholderText('Last 4 digits of SSN'), '1234')
		await userEvent.click(screen.getByRole('button', { name: /verify identity/i }))

		expect(await screen.findByText('Invalid SSN')).toBeInTheDocument()
		expect(onVerified).not.toHaveBeenCalled()
	})

	it('calls onCancel when Back is clicked', async () => {
		await userEvent.click(screen.getByRole('button', { name: /^back$/i }))
		expect(onCancel).toHaveBeenCalled()
	})
})

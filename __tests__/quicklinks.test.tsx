/**
 * QuickLinks Tests
 *
 * QuickLinks renders the `quickLinks` constant as a grid of action shortcuts
 * on the home page. This used to be inlined directly into the Home page
 * (and tested via a since-removed `homeLinks` constant); it is now its own
 * component driven by `quickLinks`, so it gets its own coverage here.
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import QuickLinks from '@/components/QuickLinks'
import { quickLinks } from '@/constants'

jest.mock('sonner', () => ({ toast: { warning: jest.fn() } }))

describe('QuickLinks', () => {
	it('renders every quickLinks label', () => {
		render(<QuickLinks />)
		quickLinks.forEach(({ label }) => {
			expect(screen.getByText(label)).toBeInTheDocument()
		})
	})

	it('renders exactly one link item per quickLinks entry', () => {
		render(<QuickLinks />)
		expect(screen.getAllByRole('link')).toHaveLength(quickLinks.length)
	})

	it('renders active links with their configured route href', () => {
		render(<QuickLinks />)
		quickLinks
			.filter(({ route }) => route !== '#')
			.forEach(({ route, label }) => {
				expect(screen.getByText(label).closest('a')).toHaveAttribute(
					'href',
					route,
				)
			})
	})

	it('renders disabled links (route "#") with the cursor-default style', () => {
		render(<QuickLinks />)
		quickLinks
			.filter(({ route }) => route === '#')
			.forEach(({ label }) => {
				expect(screen.getByText(label).closest('a')).toHaveClass(
					'cursor-default',
				)
			})
	})

	it('renders active links with the cursor-pointer style, not cursor-default', () => {
		render(<QuickLinks />)
		quickLinks
			.filter(({ route }) => route !== '#')
			.forEach(({ label }) => {
				const link = screen.getByText(label).closest('a')
				expect(link).toHaveClass('cursor-pointer')
				expect(link).not.toHaveClass('cursor-default')
			})
	})

	it('renders a "Transfer" link to /payment-transfer', () => {
		expect(quickLinks.some(({ label }) => label === 'Transfer')).toBe(true)
		render(<QuickLinks />)
		expect(screen.getByText('Transfer').closest('a')).toHaveAttribute(
			'href',
			'/payment-transfer',
		)
	})

	describe('in demo mode', () => {
		beforeEach(() => {
			jest.clearAllMocks()
		})

		it('blocks a real route with its demo-specific toast instead of navigating', async () => {
			render(<QuickLinks isDemoUser />)

			const link = screen.getByText('Transfer').closest('a')!
			expect(link).toHaveAttribute('href', '#')
			expect(link).toHaveClass('cursor-default')

			await userEvent.click(link)

			expect(toast.warning).toHaveBeenCalledWith(
				'Transfers are not available in demo mode.',
			)
		})

		it('still shows the ordinary "not built yet" toast for a route that is always disabled', async () => {
			render(<QuickLinks isDemoUser />)

			await userEvent.click(screen.getByText('Pay bill').closest('a')!)

			expect(toast.warning).toHaveBeenCalledWith("Bill pay isn't available yet.")
		})
	})
})

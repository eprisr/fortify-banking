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
import QuickLinks from '@/components/QuickLinks'
import { quickLinks } from '@/constants'

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
})

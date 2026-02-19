import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Page from '../app/(auth)/signin/page'
import Navbar from '@/components/Navbar'
import AuthForm from '@/components/AuthForm'

describe('Sign In Page', () => {
	it('renders a the auth form', () => {
		render(<AuthForm type="signin" />)
		screen.debug()

		const heading = screen.getByText('Welcome Back')

		expect(heading).toBeInTheDocument()
	})
})

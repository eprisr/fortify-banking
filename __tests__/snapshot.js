import { render } from '@testing-library/react'
import Page from '../app/(auth)/signin/page'

// connection() requires a real Next.js request-scoped AsyncLocalStorage
// context that only exists inside an actual request lifecycle; it throws
// when invoked directly from a Jest test.
jest.mock('next/server', () => ({
	...jest.requireActual('next/server'),
	connection: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signIn: jest.fn(),
	forgotPw: jest.fn(),
	resetPw: jest.fn(),
}))

it('renders the sign-in page unchanged', async () => {
	const { container } = render(await Page())
	expect(container).toMatchSnapshot()
})

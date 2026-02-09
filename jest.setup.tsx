import '@testing-library/jest-dom'
import React from 'react' //

jest.mock('next/navigation', () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			refresh: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
		}
	},
	usePathname() {
		return ''
	},
	useSearchParams: jest.fn(() => new URLSearchParams()),
	redirect: jest.fn(),
}))

jest.mock('@/lib/actions/user.actions', () => ({
	signIn: jest.fn(),
	signUp: jest.fn(),
	getLoggedInUser: jest.fn(),
	createBankAccount: jest.fn(),
	// Add other server actions here as you need them
}))

jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: any) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img {...props} />
	},
}))

// Polyfill ResizeObserver for Shadcn/Radix UI
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

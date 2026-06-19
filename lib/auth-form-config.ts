import { z } from 'zod/v4'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { authFormSchema } from '@/lib/utils'
import { forgotPw, resetPw, signIn, signUp } from '@/lib/actions/user.actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthFormType = 'signin' | 'signup' | 'forgot-pw' | 'reset-pw'

export type ResetParams = {
	userId: string | undefined
	secret: string | undefined
}

export type FormValues = z.infer<ReturnType<typeof authFormSchema>>

// ─── Form Config ──────────────────────────────────────────────────────────────

type FormConfig = {
	illustration: { src: string; alt: string } | null
	heading: string | null
	subheading: string | null
	submitLabel: string
	fields: {
		profileFields: boolean
		email: boolean
		password: boolean
		confirmPassword: boolean
		forgotPasswordLink: boolean
	}
	footer: {
		prompt: string
		linkHref: string
		linkLabel: string
	}
}

export const FORM_CONFIG: Record<AuthFormType, FormConfig> = {
	signin: {
		illustration: {
			src: '/icons/signin.svg',
			alt: 'Sign In Lock Illustration',
		},
		heading: 'Welcome Back!',
		subheading: 'Hello there, sign in to continue.',
		submitLabel: 'Sign In',
		fields: {
			profileFields: false,
			email: true,
			password: true,
			confirmPassword: false,
			forgotPasswordLink: true,
		},
		footer: {
			prompt: 'New to Fortify?',
			linkHref: '/signup',
			linkLabel: 'Create account',
		},
	},
	signup: {
		illustration: {
			src: '/icons/signup.svg',
			alt: 'Sign Up Mobile Illustration',
		},
		heading: 'Welcome to Fortify!',
		subheading: 'Hello there, create a new account.',
		submitLabel: 'Sign Up',
		fields: {
			profileFields: true,
			email: true,
			password: true,
			confirmPassword: false,
			forgotPasswordLink: false,
		},
		footer: {
			prompt: 'Already have an account?',
			linkHref: '/signin',
			linkLabel: 'Sign In',
		},
	},
	'forgot-pw': {
		illustration: null,
		heading: null,
		subheading: null,
		submitLabel: 'Send',
		fields: {
			profileFields: false,
			email: true,
			password: false,
			confirmPassword: false,
			forgotPasswordLink: false,
		},
		footer: {
			prompt: 'Remembered your password?',
			linkHref: '/signin',
			linkLabel: 'Sign In',
		},
	},
	'reset-pw': {
		illustration: null,
		heading: null,
		subheading: null,
		submitLabel: 'Send',
		fields: {
			profileFields: false,
			email: false,
			password: true,
			confirmPassword: true,
			forgotPasswordLink: false,
		},
		footer: {
			prompt: 'Remembered your password?',
			linkHref: '/signin',
			linkLabel: 'Sign In',
		},
	},
}

// ─── Submit Handlers ──────────────────────────────────────────────────────────

export type SubmitContext = {
	router: AppRouterInstance
	pathname: string
	createQueryString: (name: string, value: string) => string
	resetParams?: ResetParams
	setUser: (user: User) => void
}

export const SUBMIT_HANDLERS: Record<
	AuthFormType,
	(data: FormValues, ctx: SubmitContext) => Promise<void>
> = {
	signup: async (data, { setUser }) => {
		const res = await signUp({
			firstName: data.firstName!,
			lastName: data.lastName!,
			address1: data.address1!,
			city: data.city!,
			state: data.state!,
			postalCode: data.postalCode!,
			dateOfBirth: data.dateOfBirth!,
			ssn: data.ssn!,
			email: data.email!,
			password: data.password!,
		})
		if (!res.success) throw new Error(res.error)
		setUser(res.data)
	},
	signin: async (data, { router }) => {
		const res = await signIn({ email: data.email!, password: data.password! })
		if (!res.success) throw new Error(res.error)
		router.push('/')
	},
	'forgot-pw': async (data, { router }) => {
		const res = await forgotPw({ email: data.email! })
		if (!res.success) throw new Error(res.error)
		router.push('/signin')
	},
	'reset-pw': async (
		data,
		{ router, pathname, createQueryString, resetParams },
	) => {
		const res = await resetPw({
			userId: resetParams!.userId!,
			secret: resetParams!.secret!,
			password: data.password!,
		})
		if (!res.success) throw new Error(res.error)
		router.push(pathname + '?' + createQueryString('success', 'true'))
	},
}

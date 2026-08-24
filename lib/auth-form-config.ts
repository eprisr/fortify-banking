import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver } from 'react-hook-form'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
	signinSchema,
	forgotPwSchema,
	resetPwSchema,
	signupSchema,
	waitlistSchema,
} from '@/lib/utils'
import { forgotPw, resetPw, signIn } from '@/lib/actions/user.actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResetParams = {
	userId: string | undefined
	secret: string | undefined
}

export type ResetStatus = {
	expired: boolean | undefined
	success: boolean | undefined
}

export const AUTH_SCHEMAS = {
	signin: signinSchema,
	'forgot-pw': forgotPwSchema,
	'reset-pw': resetPwSchema,
} as const

export type AuthFormType = keyof typeof AUTH_SCHEMAS

// Intersection of all three schemas gives us the union of their fields
export type AuthFormValues = z.infer<typeof signinSchema> &
	z.infer<typeof forgotPwSchema> &
	z.infer<typeof resetPwSchema>

export type SignUpValues = z.infer<typeof signupSchema>

export type WaitlistValues = z.infer<typeof waitlistSchema>

// Each schema only validates its own field subset; the cast widens that to
// the shared AuthFormValues shape, which the unused form fields satisfy.
export const getAuthResolver = (type: AuthFormType): Resolver<AuthFormValues> =>
	zodResolver(AUTH_SCHEMAS[type]) as unknown as Resolver<AuthFormValues>

// ─── Form Config ──────────────────────────────────────────────────────────────

type FormConfig = {
	heading: string | null
	subheading: string | null
	submitLabel: string
	fields: {
		email: boolean
		password: boolean
		confirmPassword: boolean
		forgotPasswordLink: boolean
	}
	footer: {
		prompt: string | null
		linkHref: string | null
		linkLabel: string | null
	}
}

export const FORM_CONFIG: Record<AuthFormType, FormConfig> = {
	signin: {
		heading: 'Welcome back',
		subheading: 'Good to see you again.',
		submitLabel: 'Sign in',
		fields: {
			email: true,
			password: true,
			confirmPassword: false,
			forgotPasswordLink: true,
		},
		footer: {
			prompt: "Don't have an account?",
			linkHref: '/signup',
			linkLabel: 'Sign up',
		},
	},
	'forgot-pw': {
		heading: 'Reset your password',
		subheading:
			"Enter the email on your account and we'll send a code to verify it's you.",
		submitLabel: 'Send',
		fields: {
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
		heading: 'Set a new password',
		subheading: "Make it something you'll remember.",
		submitLabel: 'Reset Password',
		fields: {
			email: false,
			password: true,
			confirmPassword: true,
			forgotPasswordLink: false,
		},
		footer: {
			prompt: null,
			linkHref: null,
			linkLabel: null,
		},
	},
}

// ─── Submit Handlers ──────────────────────────────────────────────────────────

export type SubmitContext = {
	router: AppRouterInstance
	pathname: string
	createQueryString: (name: string, value: string) => string
	resetParams?: ResetParams
}

export const SUBMIT_HANDLERS: Record<
	AuthFormType,
	(data: AuthFormValues, ctx: SubmitContext) => Promise<void>
> = {
	signin: async (data, { router }) => {
		const res = await signIn({ email: data.email, password: data.password })
		if (!res.success) throw new Error(res.error)
		router.push('/')
	},
	'forgot-pw': async (data, { router }) => {
		const res = await forgotPw({ email: data.email })
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
			password: data.password,
		})
		if (!res.success) throw new Error(res.error)
		router.push(pathname + '?' + createQueryString('success', 'true'))
	},
}

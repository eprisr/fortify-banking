import { withSentryConfig } from '@sentry/nextjs'
/** @type {import('next').NextConfig} */
const nextConfig = {
	// next/jest derives its Jest transformIgnorePatterns from this list, so
	// it doubles as the fix for MSW's ESM-only dependency tree (until-async,
	// @mswjs/interceptors, etc.) failing to parse under Jest. Nothing in the
	// app imports these — they're test-only — so this has no effect on the
	// production bundle. See __tests__/msw/README.md.
	transpilePackages: [
		'msw',
		'@mswjs/interceptors',
		'until-async',
		'@bundled-es-modules',
		'@open-draft',
		'outvariant',
		'strict-event-emitter',
		'headers-polyfill',
		'is-node-process',
	],
	experimental: {
		turbo: {
			rules: {
				'*.css': {
					loaders: ['postcss-loader'],
					as: 'css',
				},
			},
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.plaid.com',
			},
			{
				protocol: 'https',
				hostname: 'plaid-merchant-logos.plaid.com',
			},
		],
	},
}

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options

	org: 'epris-richardson',
	project: 'fortify-bank',

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	// tunnelRoute: "/monitoring",

	// Hides source maps from generated client bundles
	hideSourceMaps: true,

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,
})

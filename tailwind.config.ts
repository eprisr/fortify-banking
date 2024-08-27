import type { Config } from 'tailwindcss'

const config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
		'./constants/**/*.{ts,tsx}',
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				primary: {
					100: '#F2F1F9',
					400: '#A8A3D7',
					600: '#5655B9',
					700: '#3629B7',
				},
				semantic: {
					error: '#FF4267',
					info: '#0890FE',
					warning: '#FFAF2A',
					success: '#52D5BA',
					danger: '#FB6B18',
				},
				fortify: {
					rose: '#FF4267',
					sky: '#0890FE',
					amber: '#FFAF2A',
					peacock: '#52D5BA',
					mango: '#FB6B18',
				},
				success: {
					25: '#F6FEF9',
					50: '#ECFDF3',
					100: '#D1FADF',
					600: '#039855',
					700: '#027A48',
					900: '#054F31',
				},
				blue: {
					25: '#F5FAFF',
					100: '#D1E9FF',
					500: '#2E90FA',
					600: '#1570EF',
					700: '#175CD3',
					900: '#194185',
				},
				black: {
					1: '#00214F',
					2: '#344054',
				},
				gray: {
					25: '#FCFCFD',
					200: '#E0E0E0',
					300: '#CACACA',
					400: '#989898',
					500: '#898989',
					600: '#475467',
					700: '#344054',
					900: '#343434',
				},
			},
			backgroundImage: {
				'bank-gradient':
					'linear-gradient(90deg, #A8A3D7 0%, #5655B9 26%, #281C9D 65%)',
				'gradient-mesh': "url('/icons/gradient-mesh.svg')",
				'bank-green-gradient':
					'linear-gradient(90deg, #01797A 0%, #489399 100%)',
			},
			boxShadow: {
				form: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
				chart:
					'0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
				profile:
					'0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
				creditCard: '8px 10px 16px 0px rgba(0, 0, 0, 0.05)',
				card: '0 4px 30px 0px rgba(54, 41, 183, 0.07)',
				cardSmall: '0 -5px 30px 0px rgba(54, 41, 183, 0.07)',
			},
			fontFamily: {
				poppins: 'var(--font-poppins)',
				firaSans: 'var(--font-fira-sans)',
				ibmPlexSerif: 'var(--font-ibm-plex-serif)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config

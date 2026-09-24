import { formatRelativeTime } from '@/lib/utils'

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString()
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

describe('formatRelativeTime', () => {
	it('shows "Just now" for anything under a minute old', () => {
		expect(formatRelativeTime(minutesAgo(0))).toBe('Just now')
	})

	it('shows minutes for under an hour old', () => {
		expect(formatRelativeTime(minutesAgo(5))).toBe('5m ago')
		expect(formatRelativeTime(minutesAgo(59))).toBe('59m ago')
	})

	it('shows hours for under a day old', () => {
		expect(formatRelativeTime(hoursAgo(1))).toBe('1h ago')
		expect(formatRelativeTime(hoursAgo(23))).toBe('23h ago')
	})

	it('shows days (singular/plural) for under a week old', () => {
		expect(formatRelativeTime(daysAgo(1))).toBe('1 day ago')
		expect(formatRelativeTime(daysAgo(2))).toBe('2 days ago')
		expect(formatRelativeTime(daysAgo(6))).toBe('6 days ago')
	})

	it('falls back to a short date once a week has passed', () => {
		const result = formatRelativeTime(daysAgo(10))
		expect(result).not.toMatch(/ago/)
		expect(result).toMatch(/[A-Za-z]{3} \d{1,2}/)
	})
})

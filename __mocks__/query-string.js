// This file replaces the real query-string library during tests
module.exports = {
	parse: () => ({}),
	stringify: () => '',
	stringifyUrl: () => '',
	parseUrl: () => ({ url: '', query: {} }),
	pick: () => ({}),
	exclude: () => ({}),
}

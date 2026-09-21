import type { CapacitorConfig } from '@capacitor/cli'

// The app runs entirely through Next.js server actions (Appwrite/Dwolla/Plaid),
// which `output: 'export'` can't produce a static build for. So instead of
// bundling a static site, the native shell loads the app live from a real
// Next.js server (`npm run dev -- -H 0.0.0.0`). `webDir` still has to point
// at *something* for `cap sync` to succeed, but its contents are never
// shown — `server.url` below takes over.
//
// The right host to reach that dev server depends on where the app runs:
//   - iOS Simulator shares the Mac's network, so `localhost` works directly.
//   - Android Emulator can't see the host's `localhost`; it maps the host
//     to the special alias `10.0.2.2` instead.
//   - A physical device on the same LAN needs the Mac's LAN IP (update this
//     if it changes networks).
//   - A physical device over USB (e.g. testing on public wifi, where the
//     phone and Mac aren't on the same network) needs `adb reverse tcp:3000
//     tcp:3000` run first, then `localhost` — same as the emulator's
//     loopback, but because adb forwards the port, not because of a network
//     alias.
//
// `npm run mobile:ios` / `mobile:android` sync a single platform at a time
// (`npx cap sync ios` / `npx cap sync android`), so the platform name shows
// up in argv and we can pick the right host automatically. Plain `cap sync`
// (no platform arg) falls back to the LAN IP, for physical-device testing
// over wifi. Set USB_DEVICE=1 for physical-device testing over USB instead.
const LOCAL_LAN_IP = '192.168.142.180'

const HOST = process.argv.includes('ios')
	? 'localhost'
	: process.env.USB_DEVICE
		? 'localhost'
		: process.argv.includes('android')
			? '10.0.2.2'
			: LOCAL_LAN_IP

const config: CapacitorConfig = {
	appId: 'com.example.app',
	appName: 'fortify-banking',
	webDir: 'mobile-www',
	server: {
		url: `http://${HOST}:3000`,
		cleartext: true,
	},
}

export default config

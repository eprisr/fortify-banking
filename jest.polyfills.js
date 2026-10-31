/**
 * Web platform globals (Request/Response/fetch/etc.) that Next.js's
 * `next/server` module expects to exist. jsdom does not provide them, so
 * they must be installed before the jsdom test environment (and anything
 * that imports `next/server`, e.g. pages calling `connection()`) loads.
 * Must run via `setupFiles`, not `setupFilesAfterEnv`.
 */
const { TextDecoder, TextEncoder } = require('node:util')
const { ReadableStream, TransformStream, WritableStream } = require('node:stream/web')
const {
	MessageChannel: NodeMessageChannel,
	MessagePort,
	BroadcastChannel,
} = require('node:worker_threads')

// React's scheduler prefers MessageChannel when it exists. Node's ports are
// ref'd by default, so the port React opens keeps the event loop alive and
// Jest never exits after a suite that renders React ("Jest did not exit one
// second after the test run has completed"). unref() keeps the ports working
// without holding the process open. Assigning onmessage re-refs a Node port,
// so the unref has to be re-applied after every assignment, not just once.
const unrefOnMessage = (port) => {
	const descriptor = Object.getOwnPropertyDescriptor(
		Object.getPrototypeOf(port),
		'onmessage',
	)
	Object.defineProperty(port, 'onmessage', {
		configurable: true,
		get() {
			return descriptor.get.call(port)
		},
		set(handler) {
			descriptor.set.call(port, handler)
			port.unref()
		},
	})
	port.unref()
}

class MessageChannel extends NodeMessageChannel {
	constructor() {
		super()
		unrefOnMessage(this.port1)
		unrefOnMessage(this.port2)
	}
}

Object.defineProperties(globalThis, {
	TextDecoder: { value: TextDecoder },
	TextEncoder: { value: TextEncoder },
	ReadableStream: { value: ReadableStream },
	TransformStream: { value: TransformStream },
	WritableStream: { value: WritableStream },
	MessageChannel: { value: MessageChannel },
	MessagePort: { value: MessagePort },
	// jsdom doesn't implement BroadcastChannel; MSW's core (ws support) reads
	// it at import time even when a test never mocks WebSockets.
	BroadcastChannel: { value: BroadcastChannel },
})

const { Blob, File } = require('node:buffer')
const { fetch, Headers, FormData, Request, Response } = require('undici')

Object.defineProperties(globalThis, {
	// configurable: true — MSW's node ClientRequest interceptor redefines
	// Request/Response/Headers/fetch again at server.listen() time to record
	// raw headers; without this it throws "Cannot redefine property".
	fetch: { value: fetch, writable: true, configurable: true },
	Blob: { value: Blob, configurable: true },
	File: { value: File, configurable: true },
	Headers: { value: Headers, configurable: true },
	FormData: { value: FormData, configurable: true },
	Request: { value: Request, configurable: true },
	Response: { value: Response, configurable: true },
})

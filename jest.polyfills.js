/**
 * Web platform globals (Request/Response/fetch/etc.) that Next.js's
 * `next/server` module expects to exist. jsdom does not provide them, so
 * they must be installed before the jsdom test environment (and anything
 * that imports `next/server`, e.g. pages calling `connection()`) loads.
 * Must run via `setupFiles`, not `setupFilesAfterEnv`.
 */
const { TextDecoder, TextEncoder } = require('node:util')
const { ReadableStream, TransformStream, WritableStream } = require('node:stream/web')
const { MessageChannel, MessagePort, BroadcastChannel } = require('node:worker_threads')

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

/**
 * Web platform globals (Request/Response/fetch/etc.) that Next.js's
 * `next/server` module expects to exist. jsdom does not provide them, so
 * they must be installed before the jsdom test environment (and anything
 * that imports `next/server`, e.g. pages calling `connection()`) loads.
 * Must run via `setupFiles`, not `setupFilesAfterEnv`.
 */
const { TextDecoder, TextEncoder } = require('node:util')
const { ReadableStream, TransformStream } = require('node:stream/web')
const { MessageChannel, MessagePort } = require('node:worker_threads')

Object.defineProperties(globalThis, {
	TextDecoder: { value: TextDecoder },
	TextEncoder: { value: TextEncoder },
	ReadableStream: { value: ReadableStream },
	TransformStream: { value: TransformStream },
	MessageChannel: { value: MessageChannel },
	MessagePort: { value: MessagePort },
})

const { Blob, File } = require('node:buffer')
const { fetch, Headers, FormData, Request, Response } = require('undici')

Object.defineProperties(globalThis, {
	fetch: { value: fetch, writable: true },
	Blob: { value: Blob },
	File: { value: File },
	Headers: { value: Headers },
	FormData: { value: FormData },
	Request: { value: Request },
	Response: { value: Response },
})

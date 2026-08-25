'use client'
import { createContext, useContext, useCallback, useState } from 'react'

const MobileContainerCtx = createContext<HTMLDivElement | null>(null)
export const useMobileContainer = () => useContext(MobileContainerCtx)

export function MobileContainer({ children }: { children: React.ReactNode }) {
	const [container, setContainer] = useState<HTMLDivElement | null>(null)

	const ref = useCallback(
		(node: HTMLDivElement | null) => setContainer(node),
		[],
	)

	return (
		<MobileContainerCtx.Provider value={container}>
			<div
				ref={ref}
				className="relative mx-auto my-auto flex h-166.75 w-full max-w-93.75 flex-col overflow-hidden p-9 bg-white rounded-2xl shadow-xl top-1/2 transform-[translateY(10%)]">
				{children}
			</div>
		</MobileContainerCtx.Provider>
	)
}

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
				className="relative mx-auto min-h-screen w-full max-w-107.5 pt-9 bg-white shadow-xl transform-[translateZ(0)]">
				{children}
			</div>
		</MobileContainerCtx.Provider>
	)
}

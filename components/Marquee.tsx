import { motion } from 'motion/react'

interface Props {
	items: string[]
}

const Marquee = ({ items }: Props) => {
	return (
		<div className="h-12 py-4 bg-gray-100 border border-gray-300 overflow-hidden">
			<motion.ul
				animate={{ x: ['0%', '-50%'] }}
				transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
				className="flex gap-16 items-center text-12">
				{items.map((item, i) => (
					<li key={i} className="whitespace-nowrap">
						{item}
					</li>
				))}
			</motion.ul>
		</div>
	)
}

export default Marquee

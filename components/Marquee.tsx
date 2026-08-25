import { motion } from 'motion/react'

interface Props {
	items: string[]
}

const Marquee = ({ items }: Props) => {
	return (
		<div className="h-12 py-4 bg-cloud border-[0.5] border-gold-decorative overflow-hidden">
			<motion.ul
				animate={{ x: ['0%', '-50%'] }}
				transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
				className="flex gap-16 items-center text-xs">
				{items.map((item, i) => (
					<li key={i} className="text-ink whitespace-nowrap">
						{item}
					</li>
				))}
			</motion.ul>
		</div>
	)
}

export default Marquee

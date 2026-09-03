import { Fragment } from "react"
import HeaderBox from "@/components/shared/HeaderBox"
import { settings } from "@/constants"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const Settings = async () => {
  const links = Object.groupBy(settings, ({ category }) => category)

  return (
		<>
			<section>
				<HeaderBox title="Security & Privacy" subtext="" />
				{Object.entries(links).map(([key, value], i) => {
					return (
						<Fragment key={i}>
							<h3 className="text-xxs text-gray-400 font-semibold mt-6">{key.toUpperCase()}</h3>
							{value?.map((item) => {
								const { Icon, route, label, subText, toggle, bool } = item
								return (
									<Link
										href={route}
										key={label}
										className="flex items-center justify-between bg-cloud rounded-lg p-4 my-2">
										<div className="flex items-center gap-2">
											<Icon size={20} className="m-2" />
											<div>
												<p className="text-sm font-semibold">{label}</p>
												<p className="text-xs text-gray-400">{subText}</p>
											</div>
										</div>
										{!toggle && !bool && (
											<ChevronRight size={16} className="text-ink/30" />
                    )}
                    {toggle && (<Switch />)}
                    {bool && (<p className="text-xs font-semibold">Off</p>)}
									</Link>
								)
							})}
						</Fragment>
					)
				})}
			</section>
		</>
	)
}

export default Settings
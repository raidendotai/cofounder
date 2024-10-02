import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
	ChevronRightIcon,
	ChevronDownIcon,
	FolderIcon,
	PlayIcon,
	Cog6ToothIcon,
	Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar: React.FC = () => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

	const toggleCollapse = () => setIsCollapsed(!isCollapsed);
	const togglePlayground = () => setIsPlaygroundOpen(!isPlaygroundOpen);

	return (
		<motion.div
			className="h-screen bg-black text-[#ddd] border-r border-[#222] text-sm"
			initial={{ width: 240 }}
			animate={{ width: isCollapsed ? 60 : 240 }}
			transition={{ duration: 0.2 }}
		>
			<div
				onClick={toggleCollapse}
				className="hover:bg-[#1a1a1a] cursor-pointer p-4 flex items-center justify-between"
			>
				{!isCollapsed && (
					<h1 className="flex gap-2 items-center">
						<ChevronRightIcon
							className={`w-4 h-4 text-[#bbb] transition-transform ${isCollapsed ? "" : "rotate-180"}`}
						/>
						Dashboard
					</h1>
				)}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							{(isCollapsed && (
								<button className="p-2 rounded-full">
									<ChevronRightIcon
										className={`w-4 h-4 text-[#bbb] transition-transform`}
									/>
								</button>
							)) || <div className="h-8"></div>}
						</TooltipTrigger>
						<TooltipContent>
							<p>{isCollapsed ? "Expand" : "Collapse"} sidebar</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<nav className="mt-4">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/projects"
								className="flex items-center p-3 hover:bg-[#1a1a1a]"
							>
								<FolderIcon className="w-3 h-3 text-[#bbb]" />
								{!isCollapsed && <span className="ml-3">Projects</span>}
							</Link>
						</TooltipTrigger>
						<TooltipContent>
							<p>View Projects</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{!isCollapsed && (
					<div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={togglePlayground}
										className="w-full flex items-center justify-between p-3 hover:bg-[#1a1a1a]"
									>
										<div className="flex items-center">
											<PlayIcon className="w-3 h-3 text-[#bbb]" />
											{!isCollapsed && <span className="ml-3">Playground</span>}
										</div>
										{!isCollapsed && (
											<ChevronDownIcon
												className={`w-3 h-3 transition-transform ${isPlaygroundOpen ? "rotate-180" : ""}`}
											/>
										)}
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{isPlaygroundOpen ? "Close" : "Open"} Playground</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						{isPlaygroundOpen && !isCollapsed && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											to="/playground/designer"
											className="flex items-center p-3 pl-6 hover:bg-[#1a1a1a]"
										>
											<Squares2X2Icon className="w-3 h-3 text-[#bbb]" />
											<span className="ml-3">Component Designer</span>
										</Link>
									</TooltipTrigger>
									<TooltipContent>
										<p>Open Component Designer</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				)}

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/settings"
								className="flex items-center p-3 hover:bg-[#1a1a1a]"
							>
								<Cog6ToothIcon className="w-3 h-3 text-[#bbb]" />
								{!isCollapsed && <span className="ml-3">Settings</span>}
							</Link>
						</TooltipTrigger>
						<TooltipContent>
							<p>Open Settings</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</nav>
		</motion.div>
	);
};

export default Sidebar;

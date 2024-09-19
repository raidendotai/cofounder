import React, { FC, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Cmd: FC = () => {
	const [open, setOpen] = useState(false);

	const searchCommandRef = useRef<HTMLInputElement>(null);
	// Toggle the menu when ⌘K is pressed
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((prev) => !prev);
			} else if (e.key === "Escape") {
				setOpen(false);
			}
		};
		if (open) {
			searchCommandRef.current?.focus(); // Set input as active when opening
		}
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open]);

	return (
		<>
			<AnimatePresence>
				{(open && (
					<motion.div
						className={`
              fixed top-0 left-0 inset-0 bg-black backdrop-blur-sm bg-opacity-[0.05] flex items-start justify-center
              h-[100vh] w-[100vw] overflow-hidden
            `}
						style={{ zIndex: 999999999 }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.05 }}
					>
						<AnimatePresence>
							{(open && (
								<motion.div
									className="bg-white bg-opacity-100 backdrop-blur-md min-w-3xl max-w-3xl w-full overflow-auto shadow-lg
                            mt-[15vh] min-h-[70vh] max-h-[70vh] shadow-2xl m-2 rounded rounded-lg"
									style={{ zIndex: 9999999991 }}
									id="modal"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ duration: 0.05 }}
								>
									<div className="">
										<div className="border-b w-full p-6 py-3 flex items-center">
											<span className="p-2 text-lg text-black">{`>`}</span>
											<input
												ref={searchCommandRef}
												className="p-2 w-full text-lg outline-none"
												placeholder="find"
											/>
										</div>
										<div className="p-4">
											<span className="opacity-50">[CMD+L panel not implement yet]</span>
										</div>
									</div>
								</motion.div>
							)) ||
								``}
						</AnimatePresence>
					</motion.div>
				)) ||
					``}
			</AnimatePresence>
		</>
	);
};

export default Cmd;

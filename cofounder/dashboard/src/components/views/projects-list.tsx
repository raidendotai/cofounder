import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { MicrophoneIcon } from "@heroicons/react/24/solid";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ProjectsList = () => {
	const SERVER_LOCAL_URL = "http://localhost:667/api";
	const [projects, setProjects] = useState([]);
	const [slugifiedId, setSlugifiedId] = useState("");
	const navigate = useNavigate();

	const [isRecording, setIsRecording] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);

	const form = useForm({
		defaultValues: {
			project: "",
			description: "",
			aesthetics: "",
		},
	});

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const response = await fetch(`${SERVER_LOCAL_URL}/projects/list`);
				const data = await response.json();
				setProjects(data.projects);
			} catch (error) {
				console.error("Failed to fetch projects:", error);
			}
		};

		fetchProjects();
	}, []);

	const slugify = (text: string) => {
		return text
			.toString()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w\-]+/g, "")
			.replace(/\-\-+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "");
	};

	const onSubmit = async (data: any) => {
		try {
			const response = await fetch(`${SERVER_LOCAL_URL}/projects/new`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			const responseData = await response.json();
			navigate(`/project/${responseData.project}`);
		} catch (error) {
			console.error("Failed to create new project:", error);
		}
	};

	const api_resumeProject = async ({ project }) => {
		try {
			const response = await fetch(`${SERVER_LOCAL_URL}/project/resume`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ project }),
			});
			const responseData = await response.json();
			navigate(`/project/${project}`);
		} catch (error) {
			console.error("Failed to resume project:", error);
		}
	};

	const handleRecording = async () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorderRef.current = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			});
			audioChunksRef.current = [];

			mediaRecorderRef.current.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorderRef.current.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/webm;codecs=opus",
				});
				setAudioBlob(audioBlob);

				// Convert audioBlob to base64
				const reader = new FileReader();
				reader.onloadend = async () => {
					const base64Audio = reader.result as string;
					const transcript = await transcribeAudio(base64Audio);
					if (transcript) {
						form.setValue("description", transcript);
					}
				};
				reader.readAsDataURL(audioBlob);
			};

			mediaRecorderRef.current.start();
			setIsRecording(true);
		} catch (error) {
			console.error("Error starting recording:", error);
		}
	};

	const transcribeAudio = async (base64Audio: string) => {
		try {
			const response = await fetch(`${SERVER_LOCAL_URL}/utils/transcribe`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ audio: base64Audio }),
			});

			if (!response.ok) {
				throw new Error("Transcription failed");
			}

			const data = await response.json();
			return data.transcript;
		} catch (error) {
			console.error("Error transcribing audio:", error);
			return null;
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			// Stop all tracks on the stream to release the microphone
			if (mediaRecorderRef.current.stream) {
				mediaRecorderRef.current.stream
					.getTracks()
					.forEach((track) => track.stop());
			}
			// Clear the MediaRecorder reference
			mediaRecorderRef.current = null;
		}
	};

	return (
		<>
			<div className="flex justify-between items-center mb-6 dark">
				<h1 className="text-xl">Projects</h1>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="secondary" className="font-normal">
							+&nbsp;New Project
						</Button>
					</DialogTrigger>
					<DialogContent
						className="font-light text-white bg-[#222] backdrop-blur-md
                        border-[#222] min-w-[50vw] min-h-[65vh] max-h-[90vh] overflow-auto p-8"
					>
						<DialogHeader>
							<DialogTitle className="font-normal text-xl">New Project</DialogTitle>
							<DialogDescription className="text-base text-[#ccc]">
								Enter details for your new app project
							</DialogDescription>
						</DialogHeader>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4 py-4"
							>
								<FormField
									control={form.control}
									name="project"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-light text-base">Project</FormLabel>
											<FormControl>
												<Input
													{...field}
													onChange={(e) => {
														field.onChange(e);
														setSlugifiedId(slugify(e.target.value));
													}}
													className="flex-grow bg-[#2a2a2a] border-[#333] text-base"
												/>
											</FormControl>
											<FormDescription className="text-[#aaa] text-sm">
												{(slugifiedId && `id : ${slugifiedId}`) ||
													`only use   a-z/0-9/hypens`}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem className="border-t border-[#333] pt-4">
											<FormLabel className="font-light text-base">
												Description <span className="opacity-50">(required)</span>
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Textarea
														{...field}
														className="flex-grow bg-[#2a2a2a] border-[#333] text-base font-light pr-10"
														placeholder="describe your app to the best extent you can"
														rows={4}
													/>
													<motion.button
														type="button"
														onClick={handleRecording}
														className="absolute right-4 bottom-4 text-[#aaa] hover:text-white"
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
													>
														<div className="p-2 bg-[#111] hover:bg-green-800 rounded opacity-80">
															<MicrophoneIcon
																className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`}
															/>
														</div>
													</motion.button>
												</div>
											</FormControl>
											{/*<div className="py-2 flex justify-end">
                        {audioBlob && (
                          <audio className="w-1/2" src={URL.createObjectURL(audioBlob)} controls="controls" />
                        )}
                      </div>
                      */}
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="aesthetics"
									render={({ field }) => (
										<FormItem className="border-t border-[#333] pt-4">
											<FormLabel className="font-light text-base">
												Aesthetics <span className="opacity-50">(optional)</span>
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													className="flex-grow bg-[#2a2a2a] border-[#333] text-base"
													placeholder="light theme with blue as primary"
												/>
											</FormControl>
											<FormDescription className="text-[#aaa] text-sm">
												the desired overall visual style of your app
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<DialogFooter className="mt-4 dark">
									<Button type="submit" variant="outline" className="font-normal">
										Create Project
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>
			<div className="mt-4 pt-4 border-t border-[#222] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project: any) => (
					<Link key={project.id} to={`/project/${project.id}`}>
						<motion.div
							whileHover={{ x: 5, transition: { duration: 0.2 } }}
							whileTap={{ scale: 0.95 }}
						>
							<Card className="h-full hover:shadow-lg transition-shadow duration-300 bg-[#1a1a1a] border-[#333333] group/card">
								<CardHeader>
									<CardTitle className="text-xl font-semibold text-[#ffffff] group-hover/card:after:content-['→'] group-hover/card:after:ml-2">
										{project.id}
									</CardTitle>
								</CardHeader>
								<CardContent>
									{project.data && (
										<p className="text-sm text-[#cccccc] whitespace-pre-wrap break-words line-clamp-5">
											{project.data.text}
										</p>
									)}
								</CardContent>
								<CardFooter className="flex gap-4 group border-t border-[#222] pt-4">
									<Button
										variant=""
										className="font-normal text-xs text-[#ffffff] border-[#333] hover:bg-red-700 duration-200 dark w-1/2"
										onClick={(e) => {
											e.preventDefault();
											api_resumeProject({ project: project.id });
										}}
									>
										resume
									</Button>
									<span className="hidden group-hover:block text-red-400 text-xs">
										only use if generation was interrupted !
									</span>
								</CardFooter>
							</Card>
						</motion.div>
					</Link>
				))}
			</div>
		</>
	);
};

export default ProjectsList;

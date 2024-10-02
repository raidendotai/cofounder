import React, { memo, useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default memo(({ data, isConnectable }) => {
	const [bgColor, setBgColor] = useState(data.color);
	const [randomString, setRandomString] = useState("");

	useEffect(() => {
		const interval = setInterval(() => {
			setRandomString((prev) => {
				const newString = prev + Math.random().toString(36).charAt(2);
				if (newString.length > 500) {
					clearInterval(interval);
					return newString;
				}
				return newString;
			});
		}, 10);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="dark">
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: "#555" }}
				onConnect={(params) => console.log("handle onConnect", params)}
				isConnectable={isConnectable}
			/>
			<div
				className="text-white rounded rounded-xl p-2"
				style={{
					fontFamily: "JetBrains Mono",
					fontWeight: 400,
					background: bgColor,
				}}
			>
				<div className="p-2 m-2 hover:bg-[#222] duration-200">
					Custom Color Picker Node: <strong>{data.color}</strong>
				</div>
				<pre className="text-left m-4 p-4 bg-black text-white max-w-[30vw] whitespace-pre-line break-all overflow-auto">
					random str : {randomString}
				</pre>

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">Edit Profile</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Edit profile</DialogTitle>
							<DialogDescription>
								Make changes to your profile here. Click save when you're done.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="username" className="text-right">
									Username
								</Label>
								<Input id="username" defaultValue="@peduarte" className="col-span-3" />
							</div>
						</div>
						<DialogFooter>
							<Button type="submit">Save changes</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/*
        <input
          className="nodrag rounded-lg p-1" style={{backgroundColor:bgColor}}
          type="color"
          onChange={(event) => {
            const newColor = event.target.value;
            setBgColor(newColor);
            data.onChange(event);
          }}
          defaultValue={data.color}
          style={{ cursor: 'pointer', width: '50px', height: '50px' }}
        />
        */}
			</div>
			<Handle
				type="source"
				position={Position.Right}
				id="a"
				style={{ top: 10, background: "#555" }}
				isConnectable={isConnectable}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="b"
				style={{ bottom: 10, top: "auto", background: "#555" }}
				isConnectable={isConnectable}
			/>
		</div>
	);
});

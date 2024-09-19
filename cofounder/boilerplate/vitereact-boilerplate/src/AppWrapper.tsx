import React from "react";
import App from "./App.tsx";
import FirstLaunch from "@/_cofounder/dev/firstlaunch.tsx";
import Cmdl from "@/_cofounder/dev/cmdl.tsx";

const AppWrapper: React.FC = () => {
	return (
		<>
			<FirstLaunch />
			<Cmdl />
			<App />
		</>
	);
};

export default AppWrapper;

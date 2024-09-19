// from : https://github.com/gabriel-barreto/react-error-boundary/blob/master/src/error-boundary.tsx

import { Component, ReactNode } from "react";

export type ErrorBoundaryProps = {
	children: ReactNode;
	type: string; // added type prop
	choice: string; // added choice prop
	setVersionsWithImportProblems: React.Dispatch<React.SetStateAction<string[]>>; // made state setter prop required
};

type ErrorBoundaryState = {
	error: boolean;
};

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { error: false };
	}

	componentDidCatch() {
		this.setState({ error: true });
		// Check if setVersionsWithImportProblems is a function before calling it
		if (this.props.setVersionsWithImportProblems) {
			this.props.setVersionsWithImportProblems((prev) => [
				...new Set([...prev, this.props.choice]),
			]);
		}
		console.log({ "genui:error-boundary": { choice: this.props.choice } });
	}

	render(): ReactNode {
		if (this.state.error) {
			return <></>;
		}
		return this.props.children;
	}
}

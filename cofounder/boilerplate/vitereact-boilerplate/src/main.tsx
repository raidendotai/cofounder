import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import store from "@/store/main";
import AppWrapper from "./AppWrapper.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<BrowserRouter>
			<AppWrapper />
		</BrowserRouter>
	</Provider>,
);

import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import store from "@/store/main";
import AppWrapper from "@/app-wrapper.tsx";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<BrowserRouter>
			<AppWrapper />
		</BrowserRouter>
	</Provider>,
);

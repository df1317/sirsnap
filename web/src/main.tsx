import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(
	// biome-ignore lint/style/noNonNullAssertion: root element exists in index.html
	document.getElementById("root")!,
).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

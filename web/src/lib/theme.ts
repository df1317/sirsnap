export type Theme = "light" | "dark";
export type ThemeSource = "storage" | "device" | "default";

export const THEME_STORAGE_KEY = "theme";
export const DARK_CLASS = "dark";

function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme | null {
	try {
		const value = window.localStorage.getItem(THEME_STORAGE_KEY);
		return isTheme(value) ? value : null;
	} catch {
		return null;
	}
}

export function setStoredTheme(theme: Theme): void {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Ignore errors
	}
}

export function clearStoredTheme(): void {
	try {
		window.localStorage.removeItem(THEME_STORAGE_KEY);
	} catch {
		// Ignore errors
	}
}

export function getDevicePreferredTheme(): Theme | null {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
		return null;
	}

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	if (prefersDark) return "dark";

	const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
	if (prefersLight) return "light";

	return null;
}

function disableTransitionsTemporarily(): () => void {
	const style = document.createElement("style");
	style.appendChild(
		document.createTextNode(
			"*, *::before, *::after { transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, box-shadow !important; transition-duration: 0s !important; transition-delay: 0s !important; }",
		),
	);
	document.head.appendChild(style);

	void window.getComputedStyle(document.body).opacity;

	return () => {
		style.remove();
	};
}

export function applyTheme(theme: Theme): void {
	if (typeof document === "undefined") return;

	const restoreTransitions = disableTransitionsTemporarily();
	const root = document.documentElement;

	root.classList.toggle(DARK_CLASS, theme === "dark");
	root.style.colorScheme = theme;

	void window.getComputedStyle(root).opacity;
	window.requestAnimationFrame(() => {
		restoreTransitions();
	});
}

export function resolveInitialTheme(): { theme: Theme; source: ThemeSource } {
	const storedTheme = getStoredTheme();
	if (storedTheme) {
		return { theme: storedTheme, source: "storage" };
	}

	const deviceTheme = getDevicePreferredTheme();
	if (deviceTheme) {
		return { theme: deviceTheme, source: "device" };
	}

	return { theme: "dark", source: "default" };
}

export function initializeTheme(): { theme: Theme; source: ThemeSource } {
	const resolved = resolveInitialTheme();
	applyTheme(resolved.theme);
	return resolved;
}

export function setTheme(theme: Theme, options?: { persist?: boolean }): void {
	applyTheme(theme);

	if (options?.persist === false) {
		return;
	}

	setStoredTheme(theme);
}

export function toggleTheme(): Theme {
	const isDark = typeof document !== "undefined"
		&& document.documentElement.classList.contains(DARK_CLASS);

	const nextTheme: Theme = isDark ? "light" : "dark";
	setTheme(nextTheme);
	return nextTheme;
}

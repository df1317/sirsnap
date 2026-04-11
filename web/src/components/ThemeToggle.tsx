import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { setTheme, type Theme } from "../lib/theme";
import { Button } from "./ui/button";

function getCurrentTheme(): Theme {
	if (typeof document === "undefined") return "dark";
	return document.documentElement.classList.contains("dark")
		? "dark"
		: "light";
}

export function ThemeToggle() {
	const [theme, setThemeState] = useState<Theme>(() => getCurrentTheme());

	const handleToggle = () => {
		setThemeState((currentTheme) => {
			const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
			setTheme(nextTheme);
			return nextTheme;
		});
	};

	const isDark = theme === "dark";

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			onClick={handleToggle}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</Button>
	);
}

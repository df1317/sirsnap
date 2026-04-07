import { Link, useLocation } from "react-router-dom";
import { type Session } from "../lib/api";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Footer } from "./Footer";

export function Layout({
	session,
	children,
}: {
	session: Session;
	children: React.ReactNode;
}) {
	const location = useLocation();

	const isActive = (p: string) => {
		if (p === "/") return location.pathname === "/";
		return location.pathname.startsWith(p);
	};

	const navLink = (href: string, label: string) => (
		<Link
			to={href}
			className={`text-[13px] px-3 py-1.5 rounded-md transition-colors ${
				isActive(href)
					? "text-foreground font-medium"
					: "text-muted-foreground hover:text-foreground"
			}`}
		>
			{label}
		</Link>
	);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-md">
				<div className="max-w-5xl mx-auto px-5 h-[52px] flex items-center justify-between">
					<div className="flex items-center gap-5">
						<Link to="/" className="flex items-center gap-2 shrink-0">
							<img
								src="/favicon-32x32.png"
								alt="Sirsnap Logo"
								className="w-6 h-6 rounded-md object-contain"
							/>
							<span className="font-semibold text-[13px] tracking-tight">
								Sirsnap
							</span>
						</Link>
						<nav className="flex items-center">
							{navLink("/", "Home")}
							{navLink("/meetings", "Meetings")}
							{navLink("/team", "Team")}
							{navLink("/cdts", "CDTs")}
						</nav>
					</div>

					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={session.avatar_url} />
							<AvatarFallback className="text-[10px]">
								{session.name[0]}
							</AvatarFallback>
						</Avatar>
						<span className="text-[13px] text-muted-foreground hidden sm:block">
							{session.name}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={async () => {
								await fetch("/api/auth/logout", { method: "POST" });
								window.location.href = "/";
							}}
							className="text-[13px] text-muted-foreground h-7 px-2"
						>
							Sign out
						</Button>
					</div>
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-5 py-8 w-full flex-grow">
				{children}
			</main>

			<Footer />
		</div>
	);
}

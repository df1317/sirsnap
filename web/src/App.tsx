import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, type Session } from "./lib/api";
import { Dashboard } from "./pages/Dashboard";
import { MeetingsPage } from "./pages/Meetings";
import { CdtsPage } from "./pages/Cdts";
import { TeamPage } from "./pages/Team";
import { LoginPage } from "./pages/Login";

export default function App() {
	const [session, setSession] = useState<Session | null | "loading">("loading");

	useEffect(() => {
		const cachedSession = sessionStorage.getItem("session_cache");
		if (cachedSession) {
			setSession(JSON.parse(cachedSession));
		}

		api
			.getMe()
			.then((s) => {
				setSession(s);
				sessionStorage.setItem("session_cache", JSON.stringify(s));
			})
			.catch(() => setSession(null));
	}, []);

	if (session === "loading") {
		const path = window.location.pathname;
		
		let mainContent = (
			<div className="space-y-6 animate-pulse">
				<div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
					<div className="space-y-3">
						<div className="h-4 w-24 bg-muted rounded"></div>
						<div className="border rounded-xl pt-5 pb-5 px-5 bg-card">
							<div className="flex gap-5">
								<div className="shrink-0 w-16 space-y-2">
									<div className="h-3 w-10 bg-muted rounded mx-auto"></div>
									<div className="h-8 w-12 bg-muted rounded mx-auto"></div>
								</div>
								<div className="flex-1 space-y-3">
									<div className="h-5 w-3/4 bg-muted rounded"></div>
									<div className="h-4 w-1/2 bg-muted rounded"></div>
									<div className="h-3 w-1/3 bg-muted rounded"></div>
									<div className="flex gap-2 mt-4">
										<div className="h-8 w-16 bg-muted rounded"></div>
										<div className="h-8 w-16 bg-muted rounded"></div>
										<div className="h-8 w-16 bg-muted rounded"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-3">
						<div className="h-4 w-20 bg-muted rounded"></div>
						<div className="h-[280px] bg-muted/30 border rounded-xl"></div>
					</div>
				</div>
			</div>
		);

		if (path.startsWith("/meetings")) {
			mainContent = (
				<div className="space-y-6 animate-pulse">
					<div className="space-y-1.5">
						<div className="h-6 w-24 bg-muted rounded"></div>
						<div className="h-4 w-48 bg-muted rounded"></div>
					</div>
					<div className="h-9 w-64 bg-muted rounded-md mt-4 mb-8"></div>
					<div className="border rounded-md overflow-hidden bg-card mt-2">
						<div className="h-10 border-b bg-muted/30"></div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
					</div>
				</div>
			);
		} else if (path.startsWith("/cdts") || path.startsWith("/team")) {
			mainContent = (
				<div className="space-y-6 animate-pulse">
					<div className="flex justify-between items-start">
						<div className="space-y-1.5">
							<div className="h-6 w-16 bg-muted rounded"></div>
							<div className="h-4 w-48 bg-muted rounded"></div>
						</div>
						<div className="h-8 w-24 bg-muted rounded-md"></div>
					</div>
					<div className="border rounded-md overflow-hidden bg-card">
						<div className="h-10 border-b bg-muted/30"></div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="min-h-screen bg-background flex flex-col">
				<header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-md">
					<div className="max-w-5xl mx-auto px-5 h-[52px] flex items-center justify-between">
						<div className="flex items-center gap-5">
							<div className="flex items-center gap-2 shrink-0">
								<div className="w-6 h-6 rounded-md bg-muted animate-pulse"></div>
								<div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
							</div>
						</div>
					</div>
				</header>
				<main className="max-w-5xl mx-auto px-5 py-8 w-full flex-grow">
					{mainContent}
				</main>
			</div>
		);
	}

	if (!session) {
		return <LoginPage />;
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/team/*" element={<TeamPage session={session} />} />
				<Route path="/cdts/*" element={<CdtsPage session={session} />} />
				<Route path="/meetings/*" element={<MeetingsPage session={session} />} />
				
				<Route path="/" element={<Dashboard session={session} />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

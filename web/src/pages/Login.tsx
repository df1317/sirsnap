import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { LogIn } from "lucide-react";
import { Footer } from "../components/Footer";

export function LoginPage() {
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		const err = new URLSearchParams(window.location.search).get("error");
		if (err) {
			if (err === "invalid_state") setErrorMsg("Session expired. Please try again.");
			else if (err === "server_error") setErrorMsg("An error occurred. Please try again.");
			else setErrorMsg(err);
		}
	}, []);

	const handleLogin = async () => {
		setLoading(true);
		try {
			const res = await fetch("/auth/login");
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (e) {
			console.error("Failed to start login", e);
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
			{/* Decorative Background */}
			<div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[100px] z-0 pointer-events-none"></div>

			<div className="max-w-sm w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200/50 p-8 text-center space-y-8 z-10 relative">
				<div className="mx-auto w-24 h-24 shadow-xl shadow-primary/10 rounded-2xl overflow-hidden border border-zinc-200/50">
					<img src="/sir.jpeg" alt="Sirsnap Logo" className="w-full h-full object-cover" />
				</div>
				
				<div className="space-y-3">
					<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
						Welcome to Sirsnap
					</h1>
					<p className="text-sm text-zinc-500">
						Please sign in with your Slack account to continue.
					</p>
				</div>

				{errorMsg && (
					<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium text-left">
						{errorMsg}
					</div>
				)}

				<Button
					size="lg"
					className="w-full font-medium"
					onClick={handleLogin}
					disabled={loading}
				>
					{loading ? (
						"Redirecting to Slack..."
					) : (
						<>
							<LogIn className="w-4 h-4 mr-2" />
							Sign in with Slack
						</>
					)}
				</Button>
			</div>
			
			<div className="absolute bottom-0 left-0 w-full z-10">
				<Footer />
			</div>
		</div>
	);
}

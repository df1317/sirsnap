declare const __COMMIT_HASH__: string;

export function Footer() {
	return (
		<footer className="mt-auto border-border/60 border-t bg-white/40 py-6 backdrop-blur-sm">
			<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 text-[13px] text-muted-foreground sm:flex-row">
				<div className="flex items-center gap-1.5">
					<span>Made with</span>
					<span className="text-red-500">❤️</span>
					<span>by the Digital Fusion programming team</span>
				</div>
				<div className="flex items-center gap-3">
					<a
						href={`https://github.com/df1317/sirsnap/commit/${__COMMIT_HASH__}`}
						target="_blank"
						rel="noopener noreferrer"
						className="font-mono transition-colors hover:text-foreground"
					>
						{__COMMIT_HASH__}
					</a>
				</div>
			</div>
		</footer>
	);
}

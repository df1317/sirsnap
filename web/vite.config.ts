import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";

const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		__COMMIT_HASH__: JSON.stringify(commitHash),
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						if (id.includes('react') || id.includes('react-dom')) {
							return 'vendor-react';
						}
						if (id.includes('lucide-react')) {
							return 'vendor-icons';
						}
						if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
							return 'vendor-utils';
						}
						if (id.includes('@tanstack/react-table') || id.includes('react-day-picker')) {
							return 'vendor-ui';
						}
						return 'vendor';
					}
				}
			}
		}
	},
	resolve: {
		alias: { "@": path.resolve(__dirname, "./src") },
	},
	server: {
		allowedHosts: true,
		proxy: {
			"/api": "http://localhost:8787",
			"/auth": "http://localhost:8787",
		},
	},
});

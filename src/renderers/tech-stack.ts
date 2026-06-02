export interface TechEntry {
	technology: string;
	purpose: string;
}

export interface TechStackData {
	frontend: TechEntry[];
	backend: TechEntry[];
}

/**
 * Render a markdown table from an array of tech entries.
 */
function renderTable(entries: TechEntry[]): string {
	if (entries.length === 0) return "";

	const lines: string[] = ["| Technology | Purpose |", "|------------|---------|"];

	for (const entry of entries) {
		lines.push(`| **${entry.technology}** | ${entry.purpose} |`);
	}

	return lines.join("\n");
}

/**
 * Known dependency → tech-stack mapping.
 * `label` overrides the default Title-cased package name (needed for scoped
 * packages like `@fal-ai/client` that would otherwise render badly).
 */
const KNOWN_TECH: Record<
	string,
	{ category: "frontend" | "backend"; purpose: string; label?: string }
> = {
	// --- Frontend / UI ---
	react: { category: "frontend", purpose: "UI framework" },
	"react-dom": { category: "frontend", purpose: "React DOM renderer" },
	vue: { category: "frontend", purpose: "UI framework" },
	vite: { category: "frontend", purpose: "Build tool & dev server" },
	tailwindcss: { category: "frontend", purpose: "Utility-first styling", label: "Tailwind CSS" },
	remotion: { category: "frontend", purpose: "Programmatic video rendering" },
	"@remotion/cli": { category: "frontend", purpose: "Remotion CLI", label: "Remotion CLI" },
	"@remotion/bundler": {
		category: "frontend",
		purpose: "Remotion bundler",
		label: "Remotion Bundler",
	},
	"@remotion/renderer": {
		category: "frontend",
		purpose: "Remotion server-side renderer",
		label: "Remotion Renderer",
	},
	ink: { category: "frontend", purpose: "React for interactive CLIs" },

	// --- Backend / web ---
	hono: { category: "backend", purpose: "Lightweight web framework" },
	express: { category: "backend", purpose: "Web framework" },

	// --- Data / storage ---
	"better-sqlite3": { category: "backend", purpose: "SQLite database", label: "better-sqlite3" },
	sqlite3: { category: "backend", purpose: "SQLite database" },
	sqlite: { category: "backend", purpose: "SQLite database" },

	// --- Automation / scraping ---
	playwright: { category: "backend", purpose: "Browser automation & scraping" },
	"playwright-core": {
		category: "backend",
		purpose: "Browser automation & scraping",
		label: "Playwright Core",
	},
	puppeteer: { category: "backend", purpose: "Headless browser automation" },

	// --- Media: whisper / ffmpeg ---
	"nodejs-whisper": {
		category: "backend",
		purpose: "Whisper.cpp speech-to-text bindings",
		label: "nodejs-whisper",
	},
	"smart-whisper": {
		category: "backend",
		purpose: "Whisper.cpp speech-to-text bindings",
		label: "smart-whisper",
	},
	"whisper-node": {
		category: "backend",
		purpose: "Whisper.cpp speech-to-text bindings",
		label: "whisper-node",
	},
	"fluent-ffmpeg": {
		category: "backend",
		purpose: "FFmpeg video/audio processing",
		label: "fluent-ffmpeg",
	},
	"ffmpeg-static": {
		category: "backend",
		purpose: "Bundled FFmpeg binary",
		label: "ffmpeg-static",
	},
	"@ffmpeg/ffmpeg": { category: "backend", purpose: "FFmpeg (WASM)", label: "FFmpeg (WASM)" },

	// --- AI / model providers ---
	"@fal-ai/client": { category: "backend", purpose: "fal.ai model inference", label: "fal.ai" },
	"@fal-ai/serverless-client": {
		category: "backend",
		purpose: "fal.ai serverless inference",
		label: "fal.ai",
	},
	"@anthropic-ai/sdk": {
		category: "backend",
		purpose: "Anthropic Claude API client",
		label: "Anthropic SDK",
	},
	"@google/generative-ai": {
		category: "backend",
		purpose: "Google Gemini API client",
		label: "Google Generative AI",
	},
	"@google/genai": {
		category: "backend",
		purpose: "Google Gemini API client",
		label: "Google GenAI",
	},
	"@google-cloud/storage": {
		category: "backend",
		purpose: "Google Cloud Storage client",
		label: "Google Cloud Storage",
	},
	openai: { category: "backend", purpose: "OpenAI API client", label: "OpenAI" },

	// --- Utilities ---
	"js-yaml": { category: "backend", purpose: "YAML parsing", label: "js-yaml" },
	zod: { category: "backend", purpose: "Schema validation" },
	commander: { category: "backend", purpose: "CLI argument parsing" },
	yargs: { category: "backend", purpose: "CLI argument parsing" },
};

/**
 * Auto-detect tech stack from package.json dependencies and return categorized tables.
 */
export function detectTechStack(packageJson: Record<string, unknown>): TechStackData {
	const deps = packageJson.dependencies as Record<string, string> | undefined;
	const devDeps = packageJson.devDependencies as Record<string, string> | undefined;
	const allDeps = { ...deps, ...devDeps };

	const frontend: TechEntry[] = [];
	const backend: TechEntry[] = [];

	// TypeScript is always backend/shared
	if (allDeps.typescript) {
		const version = allDeps.typescript
			.replace(/[\^~>=<]/g, "")
			.split(".")
			.slice(0, 2)
			.join(".");
		backend.push({ technology: `TypeScript ${version}`, purpose: "Type safety" });
	}

	// Bun detection
	if (allDeps["@types/bun"] || allDeps["bun-types"]) {
		backend.push({ technology: "Bun", purpose: "JavaScript runtime & package manager" });
	}

	for (const [pkg, version] of Object.entries(allDeps)) {
		const known = KNOWN_TECH[pkg];
		if (!known) continue;

		const cleanVersion = version.replace(/[\^~>=<]/g, "").split(".")[0];
		const baseName = known.label ?? `${pkg.charAt(0).toUpperCase()}${pkg.slice(1)}`;
		const entry: TechEntry = {
			technology: cleanVersion ? `${baseName} ${cleanVersion}` : baseName,
			purpose: known.purpose,
		};

		if (known.category === "frontend") {
			frontend.push(entry);
		} else {
			backend.push(entry);
		}
	}

	return { frontend, backend };
}

/**
 * Generate tech stack tables from package.json analysis.
 * Produces separate Frontend and Backend tables matching Pinboard README style.
 */
export function renderTechStack(data: TechStackData): string {
	const sections: string[] = [];

	if (data.frontend.length > 0) {
		sections.push(`### Frontend\n\n${renderTable(data.frontend)}`);
	}

	if (data.backend.length > 0) {
		sections.push(`### Backend\n\n${renderTable(data.backend)}`);
	}

	return sections.join("\n\n");
}

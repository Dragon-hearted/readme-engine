import {
	type TechStackData,
	type TocEntry,
	type TreeEntry,
	dependencyGraph,
	detectTechStack,
	pathsToTree,
	renderBadges,
	renderConfigSection,
	renderFeaturesSection,
	renderGettingStartedSection,
	renderProjectStructure,
	renderTechStack,
	renderToc,
	renderUsageSection,
} from "../renderers";
import type {
	CodeData,
	GraphData,
	LibraryData,
	ReadmeSection,
	SystemData,
	UsageData,
} from "../types";
import { centeredHero, contributing, footer, license, svgHero } from "./shared-sections";

interface RootTemplateData {
	systems: SystemData[];
	graph: GraphData;
	library: LibraryData;
	code: CodeData;
	/** Platform-level usage knowledge from repo-root knowledge/usage.yaml */
	usage?: UsageData;
}

/** Build the root monorepo README from collected data */
export function rootReadme(data: RootTemplateData): ReadmeSection[] {
	const sections: ReadmeSection[] = [];
	let order = 0;

	// Platform-level usage knowledge (empty defaults when absent)
	const usage = data.usage;
	const hasFeatures = (usage?.features.length ?? 0) > 0;
	const hasGettingStarted =
		(usage?.prerequisites.length ?? 0) > 0 || (usage?.install.length ?? 0) > 0;
	const hasUsage =
		(usage?.usageSteps.length ?? 0) > 0 || (usage?.commandsReference.length ?? 0) > 0;
	const hasConfig = (usage?.configVars.length ?? 0) > 0;

	// --- Hero ---
	const heroBadges = [
		"[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)",
		"[![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun&logoColor=000)](https://bun.sh/)",
		"[![License: MIT](https://img.shields.io/badge/License-MIT-e07a5f.svg)](LICENSE)",
	].join("\n");

	sections.push({
		name: "hero",
		order: order++,
		content: svgHero("Adcelerate", "AI-Powered Marketing & Media Platform", heroBadges),
	});

	// --- Overview ---
	const countWords = [
		"zero",
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
		"ten",
		"eleven",
		"twelve",
		"thirteen",
		"fourteen",
		"fifteen",
		"sixteen",
		"seventeen",
		"eighteen",
		"nineteen",
		"twenty",
	];
	const systemCount = data.systems.length;
	const systemCountWord = countWords[systemCount] ?? String(systemCount);
	sections.push({
		name: "overview",
		order: order++,
		content: `Adcelerate is an open-source monorepo for AI-powered marketing and media work. It bundles ${systemCountWord} independent systems — covering image generation, video storyboards, caption rendering, scraping, and a reusable prompt knowledge base — with a curated library of skills, agents, and commands orchestrated through Claude Code.`,
	});

	// --- TOC ---
	const tocEntries: TocEntry[] = [];
	if (hasFeatures) {
		tocEntries.push({ emoji: "✨", title: "Features" });
	}
	tocEntries.push(
		{ emoji: "📦", title: "Systems" },
		{ emoji: "🏗", title: "Architecture" },
		{ emoji: "🛠", title: "Tech Stack" },
		{ emoji: "📚", title: "Library" },
		{ emoji: "🚀", title: "Getting Started" },
	);
	if (hasUsage) {
		tocEntries.push({ emoji: "🚀", title: "Usage" });
	}
	if (hasConfig) {
		tocEntries.push({ emoji: "⚙️", title: "Configuration" });
	}
	tocEntries.push(
		{ emoji: "📂", title: "Project Structure" },
		{ emoji: "🤝", title: "Contributing" },
		{ emoji: "📄", title: "License" },
	);

	sections.push({
		name: "toc",
		order: order++,
		content: `## 📑 Table of Contents\n\n${renderToc(tocEntries)}`,
	});

	// --- Features (platform-level, only when authored) ---
	if (hasFeatures && usage) {
		sections.push({
			name: "features",
			order: order++,
			content: renderFeaturesSection(usage.features),
		});
	}

	// --- Systems Directory ---
	if (data.systems.length > 0) {
		const tableRows = data.systems.map((sys) => {
			const statusBadge = `![${sys.status}](https://img.shields.io/badge/Status-${encodeURIComponent(sys.status)}-${sys.status === "active" ? "brightgreen" : "lightgrey"})`;
			return `| [**${sys.name}**](${sys.path}) | ${sys.description || "—"} | ${statusBadge} |`;
		});

		sections.push({
			name: "systems",
			order: order++,
			content: [
				"## 📦 Systems",
				"",
				"| System | Description | Status |",
				"|--------|-------------|--------|",
				...tableRows,
			].join("\n"),
		});
	}

	// --- Architecture (dependency graph) ---
	if (Object.keys(data.graph.systems).length > 0) {
		const depGraph = dependencyGraph(data.graph);

		const archContent = [
			"## 🏗 Architecture",
			"",
			"![Platform Overview](images/platform-overview.svg)",
			"",
			"### Dependency Topology",
			"",
			depGraph,
		];

		sections.push({
			name: "architecture",
			order: order++,
			content: archContent.join("\n"),
		});
	}

	// --- Tech Stack (aggregated) ---
	const aggregatedStack = aggregateTechStack(data.systems);
	if (aggregatedStack.frontend.length > 0 || aggregatedStack.backend.length > 0) {
		sections.push({
			name: "tech-stack",
			order: order++,
			content: `## 🛠 Tech Stack\n\n${renderTechStack(aggregatedStack)}`,
		});
	}

	// --- Library catalog ---
	if (data.library.skillCount > 0 || data.library.agentCount > 0) {
		const libLines = [
			"## 📚 Library",
			"",
			"| Category | Count |",
			"|----------|-------|",
			`| Skills | ${data.library.skillCount} |`,
			`| Agents | ${data.library.agentCount} |`,
			`| Commands | ${data.library.commandCount} |`,
		];

		if (data.library.topSkills.length > 0) {
			libLines.push(
				"",
				"### Top Skills",
				"",
				"| Skill | Description |",
				"|-------|-------------|",
				...data.library.topSkills.map((s) => `| **${s.name}** | ${s.description} |`),
			);
		}

		if (data.library.topAgents.length > 0) {
			libLines.push(
				"",
				"### Top Agents",
				"",
				"| Agent | Description |",
				"|-------|-------------|",
				...data.library.topAgents.map((a) => `| **${a.name}** | ${a.description} |`),
			);
		}

		sections.push({
			name: "library",
			order: order++,
			content: libLines.join("\n"),
		});
	}

	// --- Getting Started ---
	// Use recon-verified platform prerequisites/install when available; otherwise
	// keep the deterministic fallback.
	if (hasGettingStarted && usage) {
		sections.push({
			name: "getting-started",
			order: order++,
			content: renderGettingStartedSection(usage.prerequisites, usage.install),
		});
	} else {
		sections.push({
			name: "getting-started",
			order: order++,
			content: [
				"## 🚀 Getting Started",
				"",
				"### Prerequisites",
				"",
				"- [**Bun**](https://bun.sh/) v1.0+ — `curl -fsSL https://bun.sh/install | bash`",
				"- [**just**](https://github.com/casey/just) — command runner",
				"",
				"### Install",
				"",
				"```bash",
				"# Clone the repository",
				"git clone --recursive https://github.com/adcelerate/adcelerate.git",
				"cd adcelerate",
				"",
				"# Run setup",
				"just install",
				"```",
			].join("\n"),
		});
	}

	// --- Usage / Step-by-Step (platform-level, only when authored) ---
	if (hasUsage && usage) {
		sections.push({
			name: "usage",
			order: order++,
			content: renderUsageSection(usage.usageSteps, usage.commandsReference),
		});
	}

	// --- Configuration (platform-level, only when documented) ---
	if (hasConfig && usage) {
		sections.push({
			name: "configuration",
			order: order++,
			content: renderConfigSection(usage.configVars),
		});
	}

	// --- Project Structure ---
	const rootTree: TreeEntry[] = [
		{
			name: "systems/",
			description: "Independent processing systems",
			children: data.systems.map((s) => ({
				name: `${s.name}/`,
				description: extractShortDesc(s.description),
			})),
		},
		{ name: "apps/", description: "Deployable applications" },
		{ name: "knowledge/", description: "Shared knowledge base" },
		{ name: "scripts/", description: "Automation scripts" },
		{ name: "docs/", description: "Documentation" },
		{ name: "justfile", description: "Command runner recipes" },
		{ name: "systems.yaml", description: "System registry" },
		{ name: "library.yaml", description: "Skills & agents catalog" },
	];

	sections.push({
		name: "project-structure",
		order: order++,
		content: `## 📂 Project Structure\n\n${renderProjectStructure("adcelerate", rootTree)}`,
	});

	// --- Contributing ---
	sections.push({
		name: "contributing",
		order: order++,
		content: contributing(),
	});

	// --- License ---
	sections.push({
		name: "license",
		order: order++,
		content: license(),
	});

	// --- Footer ---
	sections.push({
		name: "footer",
		order: order++,
		content: footer("🧡 **using Bun, TypeScript, and Claude Code**"),
	});

	return sections;
}

/** Aggregate tech stacks from all systems that have a package.json */
function aggregateTechStack(systems: SystemData[]): TechStackData {
	// Deduplicate by base technology name (without version)
	const seenBase = new Set<string>();
	const frontend: TechStackData["frontend"] = [];
	const backend: TechStackData["backend"] = [];

	for (const sys of systems) {
		if (!sys.packageJson) continue;
		const stack = detectTechStack(sys.packageJson);

		for (const entry of stack.frontend) {
			const baseName = entry.technology.replace(/\s+\d+.*$/, "");
			if (!seenBase.has(baseName)) {
				seenBase.add(baseName);
				frontend.push(entry);
			}
		}

		for (const entry of stack.backend) {
			const baseName = entry.technology.replace(/\s+\d+.*$/, "");
			if (!seenBase.has(baseName)) {
				seenBase.add(baseName);
				backend.push(entry);
			}
		}
	}

	return { frontend, backend };
}

/** Extract a short description, handling domain names like fal.ai */
function extractShortDesc(text: string): string | undefined {
	// Split on period followed by space, not on domain-like patterns
	const match = text.match(/^(.+?(?<!\w\.\w)(?<![A-Z]))\.\s/);
	const result = match ? match[1] : text;
	// Truncate if too long for tree display
	return result.length > 80 ? `${result.slice(0, 77)}...` : result || undefined;
}

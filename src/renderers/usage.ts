import type { UsageCommandRef, UsageConfigVar, UsageFeature, UsageStep } from "../types";

/**
 * Renderers for the rich knowledge sections driven by `knowledge/usage.yaml`.
 *
 * Section headings emitted (kept in sync with `renderers/toc.ts`):
 *   - renderFeaturesSection      → "## ✨ Features"
 *   - renderGettingStartedSection→ "## 🚀 Getting Started" (### Prerequisites + ### Install)
 *   - renderUsageSection         → "## 🚀 Usage" (numbered steps + optional ### Command Reference)
 *   - renderConfigSection        → "## ⚙️ Configuration"
 *
 * Every renderer returns "" when it has no data, so templates can include the
 * section conditionally (`if (block) sections.push(...)`).
 */

function escapeCell(text: string): string {
	return text.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

/** "## ✨ Features" — rich feature table. Replaces the generic task-type dump. */
export function renderFeaturesSection(features: UsageFeature[]): string {
	if (!features || features.length === 0) return "";

	const lines: string[] = [
		"## ✨ Features",
		"",
		"| Feature | Description |",
		"|---------|-------------|",
		...features.map((f) => `| **${escapeCell(f.name)}** | ${escapeCell(f.description)} |`),
	];

	return lines.join("\n");
}

/**
 * "## 🚀 Getting Started" — Prerequisites + Install.
 * Returns "" only when BOTH prerequisites and install are empty, letting the
 * template keep its hardcoded fallback Getting Started.
 */
export function renderGettingStartedSection(prerequisites: string[], install: string[]): string {
	const hasPrereqs = prerequisites && prerequisites.length > 0;
	const hasInstall = install && install.length > 0;
	if (!hasPrereqs && !hasInstall) return "";

	const lines: string[] = ["## 🚀 Getting Started", ""];

	if (hasPrereqs) {
		lines.push("### Prerequisites", "");
		for (const p of prerequisites) {
			lines.push(`- ${p}`);
		}
		lines.push("");
	}

	if (hasInstall) {
		lines.push("### Install", "", "```bash", ...install, "```");
	}

	// Trim a possible trailing blank line left by the prereqs block
	while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

	return lines.join("\n");
}

/**
 * "## 🚀 Usage" — numbered, copy-pasteable steps, each with its own code block
 * and an "Expected" note. Appends a "### Command Reference" table when present.
 */
export function renderUsageSection(
	usageSteps: UsageStep[],
	commandsReference: UsageCommandRef[] = [],
): string {
	const hasSteps = usageSteps && usageSteps.length > 0;
	const hasRef = commandsReference && commandsReference.length > 0;
	if (!hasSteps && !hasRef) return "";

	const lines: string[] = ["## 🚀 Usage"];

	if (hasSteps) {
		usageSteps.forEach((step, idx) => {
			const n = idx + 1;
			const title = step.title || step.command || `Step ${n}`;
			lines.push("", `### ${n}. ${title}`);
			if (step.command) {
				lines.push("", "```bash", step.command, "```");
			}
			if (step.expected) {
				lines.push("", `> **Expected:** ${step.expected}`);
			}
		});
	}

	if (hasRef) {
		lines.push(
			"",
			"### Command Reference",
			"",
			"| Command | Description |",
			"|---------|-------------|",
			...commandsReference.map(
				(c) => `| \`${escapeCell(c.command)}\` | ${escapeCell(c.description)} |`,
			),
		);
	}

	return lines.join("\n");
}

/** "## ⚙️ Configuration" — env/config variable table. */
export function renderConfigSection(configVars: UsageConfigVar[]): string {
	if (!configVars || configVars.length === 0) return "";

	const lines: string[] = [
		"## ⚙️ Configuration",
		"",
		"| Variable | Required | Description |",
		"|----------|----------|-------------|",
		...configVars.map(
			(c) =>
				`| \`${escapeCell(c.name)}\` | ${c.required ? "Yes" : "No"} | ${escapeCell(c.description)} |`,
		),
	];

	return lines.join("\n");
}

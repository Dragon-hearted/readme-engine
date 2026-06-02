import yaml from "js-yaml";
import type { UsageCommandRef, UsageConfigVar, UsageData, UsageFeature, UsageStep } from "../types";

/**
 * ============================================================================
 *  usage.yaml — the knowledge contract (Appendix A of the rewrite plan)
 * ============================================================================
 *
 * Recon agents author one of these per scope at `knowledge/usage.yaml`:
 *   - per system → `systems/<system>/knowledge/usage.yaml`
 *   - platform   → repo-root `knowledge/usage.yaml`
 *
 * ALL keys are optional. The engine renders only the sections that have data;
 * when the file is entirely absent the engine falls back to its prior
 * (deterministic, template-driven) output. Authored shape:
 *
 *   features:                 # → "## ✨ Features" table (replaces task-type dump)
 *     - name: "Word-level captions"
 *       description: "Whisper word timestamps painted as overlays."
 *   prerequisites:            # → "### Prerequisites" bullet list
 *     - "Bun v1.0+ — curl -fsSL https://bun.sh/install | bash"
 *   configVars:               # → "## ⚙️ Configuration" table
 *     - name: "WISGATE_API_KEY"
 *       required: true
 *       description: "Auth token for the WisGate gateway."
 *   install:                  # → "### Install" code block (ordered)
 *     - "cd systems/autoCaption"
 *     - "bun install"
 *   usageSteps:               # → "## 🚀 Usage" numbered steps, each a code block
 *     - title: "Caption a video"
 *       command: "bun run src/cli.ts caption input.mp4 --style tiktok"
 *       expected: "Writes output/input.captioned.mp4 (1080x1920, h264)."
 *   commandsReference:        # optional → "### Command Reference" table
 *     - command: "bun run src/cli.ts --help"
 *       description: "List all commands and flags."
 *
 * A credential-gated step still lists its command, with `expected` noting
 * e.g. "requires WISGATE_API_KEY — not executed".
 * ============================================================================
 */

interface UsageYaml {
	features?: Array<{ name?: unknown; description?: unknown }>;
	prerequisites?: unknown[];
	configVars?: Array<{ name?: unknown; required?: unknown; description?: unknown }>;
	install?: unknown[];
	usageSteps?: Array<{ title?: unknown; command?: unknown; expected?: unknown }>;
	commandsReference?: Array<{ command?: unknown; description?: unknown }>;
}

/** An empty, fully-defaulted UsageData (graceful fallback). */
export function emptyUsageData(): UsageData {
	return {
		features: [],
		prerequisites: [],
		configVars: [],
		install: [],
		usageSteps: [],
		commandsReference: [],
	};
}

function asString(value: unknown): string {
	if (typeof value === "string") return value.trim();
	if (value == null) return "";
	return String(value).trim();
}

function asStringList(value: unknown[] | undefined): string[] {
	if (!Array.isArray(value)) return [];
	return value.map(asString).filter((s) => s.length > 0);
}

function normalizeFeatures(raw: UsageYaml["features"]): UsageFeature[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((f) => ({ name: asString(f?.name), description: asString(f?.description) }))
		.filter((f) => f.name.length > 0);
}

function normalizeConfigVars(raw: UsageYaml["configVars"]): UsageConfigVar[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((c) => ({
			name: asString(c?.name),
			required: c?.required === true,
			description: asString(c?.description),
		}))
		.filter((c) => c.name.length > 0);
}

function normalizeSteps(raw: UsageYaml["usageSteps"]): UsageStep[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((s) => ({
			title: asString(s?.title),
			command: asString(s?.command),
			expected: asString(s?.expected),
		}))
		.filter((s) => s.title.length > 0 || s.command.length > 0);
}

function normalizeCommandRefs(raw: UsageYaml["commandsReference"]): UsageCommandRef[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((c) => ({ command: asString(c?.command), description: asString(c?.description) }))
		.filter((c) => c.command.length > 0);
}

/**
 * Read and normalize a `usage.yaml` at the given absolute path.
 * Returns a fully-defaulted, empty UsageData when the file is missing or
 * cannot be parsed — callers never need to null-check.
 */
export async function collectUsage(usageYamlPath: string): Promise<UsageData> {
	let raw: string;
	try {
		raw = await Bun.file(usageYamlPath).text();
	} catch {
		return emptyUsageData();
	}

	let parsed: UsageYaml | null;
	try {
		parsed = yaml.load(raw) as UsageYaml | null;
	} catch (err) {
		console.warn(`[usage-collector] Failed to parse ${usageYamlPath}:`, err);
		return emptyUsageData();
	}

	if (!parsed || typeof parsed !== "object") return emptyUsageData();

	return {
		features: normalizeFeatures(parsed.features),
		prerequisites: asStringList(parsed.prerequisites),
		configVars: normalizeConfigVars(parsed.configVars),
		install: asStringList(parsed.install),
		usageSteps: normalizeSteps(parsed.usageSteps),
		commandsReference: normalizeCommandRefs(parsed.commandsReference),
	};
}

/** True when a UsageData carries no renderable content. */
export function isUsageEmpty(usage: UsageData | undefined): boolean {
	if (!usage) return true;
	return (
		usage.features.length === 0 &&
		usage.prerequisites.length === 0 &&
		usage.configVars.length === 0 &&
		usage.install.length === 0 &&
		usage.usageSteps.length === 0 &&
		usage.commandsReference.length === 0
	);
}

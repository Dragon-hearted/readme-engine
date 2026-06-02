/** Target scope for README generation */
export type ReadmeTarget = "root" | "system" | "app";

/** Scope specification for a README operation */
export interface ReadmeScope {
	type: ReadmeTarget;
	name?: string;
}

/** A single rich feature (name + description) from usage.yaml */
export interface UsageFeature {
	name: string;
	description: string;
}

/** An environment/configuration variable from usage.yaml */
export interface UsageConfigVar {
	name: string;
	required: boolean;
	description: string;
}

/** An ordered, verified usage step (command + expected result) */
export interface UsageStep {
	title: string;
	command: string;
	expected: string;
}

/** An optional command-reference row */
export interface UsageCommandRef {
	command: string;
	description: string;
}

/**
 * Structured usage knowledge read from `knowledge/usage.yaml` for a scope.
 * All fields are optional in the source; the collector normalizes missing
 * sections to empty arrays so renderers can emit only the sections with data.
 */
export interface UsageData {
	features: UsageFeature[];
	prerequisites: string[];
	configVars: UsageConfigVar[];
	install: string[];
	usageSteps: UsageStep[];
	commandsReference: UsageCommandRef[];
}

/** Collected data about a registered system */
export interface SystemData {
	name: string;
	description: string;
	path: string;
	status: string;
	stages: string[];
	dependencies: string[];
	taskTypes: string[];
	inputTypes: string[];
	outputTypes: string[];
	domainTags: string[];
	entryPoint: string;
	knowledgeSummary: string;
	packageJson: Record<string, unknown> | null;
	/** Rich usage knowledge from knowledge/usage.yaml (empty when absent) */
	usage?: UsageData;
}

/** Collected data from the knowledge graph */
export interface GraphData {
	systems: Record<string, { depends_on: string[] }>;
	relationships: Array<{ from: string; to: string; type: string }>;
	communities: Array<{ name: string; members: string[] }>;
	godNodes: string[];
}

/** Collected data from the library catalog */
export interface LibraryData {
	skillCount: number;
	agentCount: number;
	commandCount: number;
	topSkills: Array<{ name: string; description: string }>;
	topAgents: Array<{ name: string; description: string }>;
}

/** Collected data from git history */
export interface GitData {
	recentCommits: Array<{ hash: string; message: string; date: string }>;
	perScopeCommits: Record<string, Array<{ hash: string; message: string; date: string }>>;
}

/** Collected data from code/filesystem analysis */
export interface CodeData {
	entryPoints: string[];
	sourceTree: string;
	directories: string[];
}

/** Collected data about an app in apps/ */
export interface AppData {
	name: string;
	path: string;
	packageJson: Record<string, unknown> | null;
	sourceTree: string;
}

/** Drift report for a README scope */
export interface DriftReport {
	scope: ReadmeScope;
	sections: Array<{
		name: string;
		status: DriftStatus;
		lastChecked: string;
	}>;
	recommendations: string[];
}

/** Fingerprint of a README section for drift detection */
export interface SectionFingerprint {
	sectionName: string;
	hash: string;
	sourceFiles: string[];
	timestamp: string;
}

/** Drift status for a section */
export type DriftStatus = "current" | "stale" | "unknown";

/** A rendered README section */
export interface ReadmeSection {
	name: string;
	content: string;
	order: number;
}

/** An SVG asset to be written to disk */
export interface SvgAsset {
	name: string;
	content: string;
}

/** A fully rendered README */
export interface RenderedReadme {
	scope: ReadmeScope;
	sections: ReadmeSection[];
	fullContent: string;
	generatedAt: string;
}

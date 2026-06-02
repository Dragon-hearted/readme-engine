export interface TocEntry {
	emoji: string;
	title: string;
	anchor?: string;
}

/**
 * Slugify a heading the EXACT way GitHub's github-slugger does, so intra-doc
 * TOC links actually jump.
 *
 * GitHub renders each section heading as `## <emoji> <title>` and derives its
 * anchor id from that full text. github-slugger's algorithm is:
 *   1. lowercase
 *   2. remove every char that is NOT a letter (\p{L}), number (\p{N}),
 *      connector punctuation (\p{Pc}, e.g. "_"), format char (\p{Cf}, which
 *      INCLUDES the U+FE0F variation selector), combining mark (\p{M}),
 *      hyphen, or space — this strips emoji/symbols
 *   3. replace each space with a hyphen (per-space, NO collapsing, NO trimming)
 *
 * Critically it does NOT trim a leading hyphen, so a stripped leading
 * "emoji + space" leaves a leading hyphen:
 *   "✨ Features"        → "-features"
 *   "🚀 Usage"           → "-usage"
 *   "⚙️ Configuration"   → "️-configuration"  (gear stripped, U+FE0F survives)
 *   "🏗 Architecture"    → "-architecture"
 * We therefore slug the FULL `emoji + title` string, not just the title.
 */
function githubSlug(headingText: string): string {
	return headingText
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\p{Pc}\p{Cf}\p{M}\- ]/gu, "")
		.replace(/ /g, "-");
}

/**
 * Generate a table of contents from section headers.
 * Produces a GitHub-compatible markdown list with anchor links whose slugs
 * match the rendered `## <emoji> <title>` headings exactly.
 */
export function renderToc(entries: TocEntry[]): string {
	if (entries.length === 0) return "";

	const lines = entries.map((entry) => {
		const display = entry.emoji ? `${entry.emoji} ${entry.title}` : entry.title;
		const anchor = entry.anchor ?? githubSlug(display);
		return `- [${display}](#${anchor})`;
	});

	return lines.join("\n");
}

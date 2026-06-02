// ── Color Palette ──────────────────────────────────────────────
export const COLORS = {
	indigo: "#6366F1",
	purple: "#8B5CF6",
	emerald: "#10B981",
	amber: "#F59E0B",
	cyan: "#06B6D4",
	red: "#EF4444",
} as const;

export const DARK = {
	cardFill: "#0F172A",
	text: "#E0E0E0",
	secondary: "#9CA3AF",
	stroke: "#1E293B",
} as const;

// ── Fonts ──────────────────────────────────────────────────────
export const FONTS = {
	body: "Inter, system-ui, sans-serif",
	code: "JetBrains Mono, monospace",
} as const;

// ── Animation Timing ──────────────────────────────────────────
export const ANIM = {
	fadeIn: { dur: "0.6s", fill: "freeze" },
	staggerStep: 0.3,
	breatheDelay: 3,
	breatheDur: "4s",
	dashDur: "2s",
	floatDur: "3s",
	floatDistance: 3,
} as const;

// ── Canvas Defaults ───────────────────────────────────────────
export const CANVAS = {
	width: 800,
	xmlns: "http://www.w3.org/2000/svg",
} as const;

// ── Domain Tag → Color Mapping ────────────────────────────────
const TAG_COLOR_MAP: Record<string, string> = {
	scraping: COLORS.cyan,
	ai: COLORS.purple,
	media: COLORS.amber,
	automation: COLORS.emerald,
	analytics: COLORS.indigo,
	marketing: COLORS.red,
	infrastructure: COLORS.cyan,
	content: COLORS.amber,
	data: COLORS.indigo,
};

const COLOR_CYCLE = [
	COLORS.indigo,
	COLORS.purple,
	COLORS.emerald,
	COLORS.amber,
	COLORS.cyan,
	COLORS.red,
];

export function domainTagToColor(tags: string[]): string {
	for (const tag of tags) {
		const key = tag.toLowerCase();
		if (TAG_COLOR_MAP[key]) return TAG_COLOR_MAP[key];
	}
	// Deterministic fallback based on first tag hash
	if (tags.length > 0) {
		let hash = 0;
		for (const ch of tags[0]) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
		return COLOR_CYCLE[Math.abs(hash) % COLOR_CYCLE.length];
	}
	return COLORS.indigo;
}

// ── SVG Glow Filter Definitions ──────────────────────────────
export function glowFilterDefs(colors: string[]): string {
	const unique = [...new Set(colors)];
	const filters = unique.map((color, i) => {
		const id = `glow-${i}`;
		return `    <filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
      <feFlood flood-color="${color}" flood-opacity="0.35" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>`;
	});
	return filters.join("\n");
}

export function glowFilterId(colors: string[], color: string): string {
	const unique = [...new Set(colors)];
	return `glow-${unique.indexOf(color)}`;
}

// ── Arrow Marker Definition ──────────────────────────────────
export function arrowMarkerDef(color: string, id = "arrow"): string {
	return `    <marker id="${id}" viewBox="0 0 10 6" refX="10" refY="3"
      markerWidth="8" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,3 L0,6 Z" fill="${color}" />
    </marker>`;
}

// ── SVG Primitives ────────────────────────────────────────────

/** Wrap full SVG document */
export function svgDoc(width: number, height: number, defsContent: string, body: string): string {
	return `<svg xmlns="${CANVAS.xmlns}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
${defsContent}
  </defs>
${body}
</svg>`;
}

/** Rounded rectangle with optional glow, stroke color, and fill */
export function glowRect(opts: {
	x: number;
	y: number;
	w: number;
	h: number;
	rx?: number;
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	filterId?: string;
}): string {
	const rx = opts.rx ?? 10;
	const fill = opts.fill ?? DARK.cardFill;
	const stroke = opts.stroke ?? DARK.stroke;
	const sw = opts.strokeWidth ?? 1.5;
	const filter = opts.filterId ? ` filter="url(#${opts.filterId})"` : "";
	return `<rect x="${opts.x}" y="${opts.y}" width="${opts.w}" height="${opts.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${filter} />`;
}

/** Animated dashed connection line between two points */
export function animatedLine(opts: {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	color?: string;
	markerId?: string;
	delay?: number;
}): string {
	const color = opts.color ?? DARK.secondary;
	const delay = opts.delay ?? 0;
	const marker = opts.markerId ? ` marker-end="url(#${opts.markerId})"` : "";
	return `<line x1="${opts.x1}" y1="${opts.y1}" x2="${opts.x2}" y2="${opts.y2}"
    stroke="${color}" stroke-width="1.5" stroke-dasharray="6,4"${marker} opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="${ANIM.dashDur}" begin="${delay}s" repeatCount="indefinite" />
  </line>`;
}

/** A card node with label and optional description */
export function nodeCard(opts: {
	x: number;
	y: number;
	w: number;
	h: number;
	label: string;
	description?: string;
	color: string;
	filterId?: string;
	delay?: number;
}): string {
	const delay = opts.delay ?? 0;
	const cx = opts.x + opts.w / 2;
	const labelY = opts.description ? opts.y + opts.h / 2 - 6 : opts.y + opts.h / 2 + 5;
	const fillOpacity = "0.08";

	let descLine = "";
	if (opts.description) {
		const maxChars = Math.floor(opts.w / 7);
		const desc =
			opts.description.length > maxChars
				? `${opts.description.slice(0, maxChars - 1)}\u2026`
				: opts.description;
		descLine = `\n    <text x="${cx}" y="${opts.y + opts.h / 2 + 14}" text-anchor="middle" fill="${DARK.secondary}" font-family="${FONTS.body}" font-size="11">${escXml(desc)}</text>`;
	}

	return `  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
    <animateTransform attributeName="transform" type="translate" values="0,0;0,-${ANIM.floatDistance};0,0" dur="${ANIM.floatDur}" begin="${ANIM.breatheDelay + delay}s" repeatCount="indefinite" />
    ${glowRect({ x: opts.x, y: opts.y, w: opts.w, h: opts.h, stroke: opts.color, fill: hexWithAlpha(opts.color, fillOpacity), filterId: opts.filterId })}
    <text x="${cx}" y="${labelY}" text-anchor="middle" fill="${DARK.text}" font-family="${FONTS.body}" font-size="13" font-weight="600">${escXml(opts.label)}</text>${descLine}
  </g>`;
}

/** Title text with optional glow filter */
export function titleText(opts: {
	x: number;
	y: number;
	text: string;
	size?: number;
	color?: string;
	filterId?: string;
	delay?: number;
}): string {
	const size = opts.size ?? 28;
	const color = opts.color ?? DARK.text;
	const delay = opts.delay ?? 0;
	const filter = opts.filterId ? ` filter="url(#${opts.filterId})"` : "";
	return `  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
    <text x="${opts.x}" y="${opts.y}" text-anchor="middle" fill="${color}" font-family="${FONTS.body}" font-size="${size}" font-weight="700"${filter}>${escXml(opts.text)}</text>
  </g>`;
}

/** Decorative accent line (horizontal) */
export function accentLine(opts: {
	cx: number;
	y: number;
	width: number;
	color: string;
	delay?: number;
}): string {
	const delay = opts.delay ?? 0;
	const x1 = opts.cx - opts.width / 2;
	const x2 = opts.cx + opts.width / 2;
	return `  <line x1="${x1}" y1="${opts.y}" x2="${x2}" y2="${opts.y}" stroke="${opts.color}" stroke-width="2" stroke-linecap="round" opacity="0">
    <animate attributeName="opacity" from="0" to="0.7" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
  </line>`;
}

// ── Helpers ───────────────────────────────────────────────────
export function escXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function hexWithAlpha(hex: string, opacity: string): string {
	return `${hex}${Math.round(Number.parseFloat(opacity) * 255)
		.toString(16)
		.padStart(2, "0")}`;
}

// ── Text Measurement & Fitting ────────────────────────────────
// Approximations tuned for Inter (system fallback). Slightly conservative so
// text never visually overflows the box even on narrower-glyph platforms.

const AVG_CHAR_WIDTH_RATIO = { normal: 0.55, bold: 0.58 } as const;

export function estimateTextWidth(
	text: string,
	fontSize: number,
	weight: "normal" | "bold" = "normal",
): number {
	// Per-char width estimate (proportional fonts vary; this is an upper-ish bound).
	let total = 0;
	const ratio = AVG_CHAR_WIDTH_RATIO[weight];
	for (const ch of text) {
		if (ch === " ") total += fontSize * 0.28;
		else if ("ilI|.,;:'!".includes(ch)) total += fontSize * 0.33;
		else if ("MWmw".includes(ch)) total += fontSize * 0.85;
		else total += fontSize * ratio;
	}
	return total;
}

/** Greedy word-wrap. Long single words break preferentially on hyphens, then hard-break as a fallback. */
export function wrapText(
	text: string,
	maxWidth: number,
	fontSize: number,
	weight: "normal" | "bold" = "normal",
): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = "";

	const flush = () => {
		if (current) {
			lines.push(current);
			current = "";
		}
	};

	for (const word of words) {
		let w = word;
		// If `w` is wider than the box, split it on hyphens first (keep the hyphen
		// on the trailing piece of the line). Fall back to hard char-break if a
		// hyphen-segment is itself too wide.
		while (estimateTextWidth(w, fontSize, weight) > maxWidth && w.length > 1) {
			const hyphenIdx = findLastHyphenThatFits(w, maxWidth, fontSize, weight);
			if (hyphenIdx > 0) {
				flush();
				// Keep the hyphen at the end of the broken-off line for readability.
				lines.push(w.slice(0, hyphenIdx + 1));
				w = w.slice(hyphenIdx + 1);
			} else {
				// No usable hyphen — hard char-break.
				let cut = w.length - 1;
				while (cut > 1 && estimateTextWidth(w.slice(0, cut), fontSize, weight) > maxWidth) cut--;
				flush();
				lines.push(w.slice(0, cut));
				w = w.slice(cut);
			}
		}

		const candidate = current ? `${current} ${w}` : w;
		if (estimateTextWidth(candidate, fontSize, weight) <= maxWidth) {
			current = candidate;
		} else {
			flush();
			current = w;
		}
	}
	flush();
	return lines;
}

/** Find the right-most hyphen position whose prefix (incl. hyphen) fits maxWidth. Returns -1 if none. */
function findLastHyphenThatFits(
	word: string,
	maxWidth: number,
	fontSize: number,
	weight: "normal" | "bold",
): number {
	let best = -1;
	for (let i = 1; i < word.length - 1; i++) {
		if (word[i] !== "-") continue;
		const prefix = word.slice(0, i + 1);
		if (estimateTextWidth(prefix, fontSize, weight) <= maxWidth) best = i;
		else break;
	}
	return best;
}

/** Wrap and clamp to maxLines; ellipsize the last line if truncated. */
export function fitText(
	text: string,
	maxWidth: number,
	maxLines: number,
	fontSize: number,
	weight: "normal" | "bold" = "normal",
): string[] {
	const lines = wrapText(text, maxWidth, fontSize, weight);
	if (lines.length <= maxLines) return lines;
	const head = lines.slice(0, maxLines - 1);
	let tail = lines.slice(maxLines - 1).join(" ");
	// Trim trailing words/chars until tail + ellipsis fits.
	const ellipsis = "…";
	while (tail.length > 0 && estimateTextWidth(`${tail}${ellipsis}`, fontSize, weight) > maxWidth) {
		// Drop a trailing word first; if a single very long word, drop chars.
		const lastSpace = tail.lastIndexOf(" ");
		if (lastSpace > 0) tail = tail.slice(0, lastSpace);
		else tail = tail.slice(0, -1);
	}
	return [...head, `${tail.trimEnd()}${ellipsis}`];
}

/** Shrink fontSize down to minSize until the (already-wrapped) text fits maxWidth. */
export function shrinkToFit(
	text: string,
	maxWidth: number,
	baseSize: number,
	minSize: number,
	weight: "normal" | "bold" = "normal",
): number {
	let size = baseSize;
	while (size > minSize && estimateTextWidth(text, size, weight) > maxWidth) size -= 1;
	return size;
}

/** Render multiple text lines centered horizontally on x, baseline starting at y, line-height in px. */
export function multilineText(opts: {
	lines: string[];
	x: number;
	y: number;
	lineHeight: number;
	fontSize: number;
	weight?: "normal" | "bold";
	fill: string;
	anchor?: "middle" | "start" | "end";
	delay?: number;
	fadeIn?: boolean;
	filterId?: string;
}): string {
	const weight = opts.weight ?? "normal";
	const anchor = opts.anchor ?? "middle";
	const delay = opts.delay ?? 0;
	const filter = opts.filterId ? ` filter="url(#${opts.filterId})"` : "";
	const tspans = opts.lines
		.map((line, i) => {
			const dy = i === 0 ? 0 : opts.lineHeight;
			return `      <tspan x="${opts.x}" dy="${dy}">${escXml(line)}</tspan>`;
		})
		.join("\n");

	const fontWeightAttr = weight === "bold" ? ` font-weight="600"` : "";
	if (!opts.fadeIn) {
		return `  <text x="${opts.x}" y="${opts.y}" text-anchor="${anchor}" fill="${opts.fill}" font-family="${FONTS.body}" font-size="${opts.fontSize}"${fontWeightAttr}${filter}>
${tspans}
  </text>`;
	}
	return `  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
    <text x="${opts.x}" y="${opts.y}" text-anchor="${anchor}" fill="${opts.fill}" font-family="${FONTS.body}" font-size="${opts.fontSize}"${fontWeightAttr}${filter}>
${tspans}
    </text>
  </g>`;
}

/** Auto-sizing card: pre-measures label + description, returns wrapped lines + box dims. */
export interface AutoCardLayout {
	lines: { label: string[]; desc: string[] };
	labelSize: number;
	descSize: number;
	width: number;
	height: number;
	labelWeight: "bold";
	descWeight: "normal";
}

export function autoCardLayout(opts: {
	label: string;
	description?: string;
	minWidth: number;
	maxWidth: number;
	labelMaxLines?: number;
	descMaxLines?: number;
	labelSize?: number;
	descSize?: number;
	paddingX?: number;
	paddingY?: number;
	lineGap?: number;
}): AutoCardLayout {
	const labelSize = opts.labelSize ?? 13;
	const descSize = opts.descSize ?? 11;
	const padX = opts.paddingX ?? 12;
	const padY = opts.paddingY ?? 12;
	const lineGap = opts.lineGap ?? 4;
	const labelMaxLines = opts.labelMaxLines ?? 2;
	const descMaxLines = opts.descMaxLines ?? 3;

	// Pick the smallest width in [minWidth, maxWidth] that lets BOTH the label
	// and the description fit without ellipsis. We grow the box up to maxWidth
	// before truncating so descriptions don't get clipped just because the
	// label happens to be short.
	const labelSingleW = estimateTextWidth(opts.label, labelSize, "bold") + padX * 2;
	let width = Math.max(opts.minWidth, Math.min(opts.maxWidth, Math.ceil(labelSingleW)));

	// If a description is provided, grow `width` until the description wraps
	// within `descMaxLines` (or we hit `maxWidth`).
	if (opts.description && descMaxLines > 0) {
		while (width < opts.maxWidth) {
			const lines = wrapText(opts.description, width - padX * 2, descSize, "normal");
			if (lines.length <= descMaxLines) break;
			width += 8;
		}
		if (width > opts.maxWidth) width = opts.maxWidth;
	}

	let labelLines = fitText(opts.label, width - padX * 2, labelMaxLines, labelSize, "bold");
	// If the label is wider than the chosen width, bump width up to its single-line size (capped).
	if (labelLines.length > 1 && labelSingleW > width) {
		width = Math.min(opts.maxWidth, Math.ceil(labelSingleW));
		labelLines = fitText(opts.label, width - padX * 2, labelMaxLines, labelSize, "bold");
	}

	let descLines: string[] = [];
	if (opts.description && descMaxLines > 0) {
		descLines = fitText(opts.description, width - padX * 2, descMaxLines, descSize, "normal");
	}

	const labelBlockH = labelLines.length * (labelSize + lineGap) - lineGap;
	const descBlockH = descLines.length > 0 ? descLines.length * (descSize + lineGap) - lineGap : 0;
	const innerH = labelBlockH + (descBlockH > 0 ? 8 + descBlockH : 0);
	const height = innerH + padY * 2;

	return {
		lines: { label: labelLines, desc: descLines },
		labelSize,
		descSize,
		width,
		height,
		labelWeight: "bold",
		descWeight: "normal",
	};
}

/** Render a card from an auto layout result. Card body grows to fit its text. */
export function autoNodeCard(opts: {
	x: number;
	y: number;
	layout: AutoCardLayout;
	color: string;
	filterId?: string;
	delay?: number;
	rx?: number;
}): string {
	const delay = opts.delay ?? 0;
	const padY = 12;
	const lineGap = 4;
	const cx = opts.x + opts.layout.width / 2;
	const fillOpacity = "0.08";

	// Label baseline: sit the first label line below the top padding.
	const labelY = opts.y + padY + opts.layout.labelSize;
	const labelLineHeight = opts.layout.labelSize + lineGap;

	const labelText = multilineText({
		lines: opts.layout.lines.label,
		x: cx,
		y: labelY,
		lineHeight: labelLineHeight,
		fontSize: opts.layout.labelSize,
		weight: "bold",
		fill: DARK.text,
		anchor: "middle",
	});

	let descText = "";
	if (opts.layout.lines.desc.length > 0) {
		const descStartY =
			labelY + (opts.layout.lines.label.length - 1) * labelLineHeight + 8 + opts.layout.descSize;
		descText = multilineText({
			lines: opts.layout.lines.desc,
			x: cx,
			y: descStartY,
			lineHeight: opts.layout.descSize + lineGap,
			fontSize: opts.layout.descSize,
			weight: "normal",
			fill: DARK.secondary,
			anchor: "middle",
		});
	}

	return `  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${delay}s" fill="${ANIM.fadeIn.fill}" />
    <animateTransform attributeName="transform" type="translate" values="0,0;0,-${ANIM.floatDistance};0,0" dur="${ANIM.floatDur}" begin="${ANIM.breatheDelay + delay}s" repeatCount="indefinite" />
    ${glowRect({ x: opts.x, y: opts.y, w: opts.layout.width, h: opts.layout.height, rx: opts.rx ?? 10, stroke: opts.color, fill: hexWithAlpha(opts.color, fillOpacity), filterId: opts.filterId })}
${labelText}
${descText}
  </g>`;
}

import type { SystemData } from "../../types";
import {
  CANVAS, DARK, FONTS, ANIM, COLORS,
  domainTagToColor, glowFilterDefs, glowFilterId, arrowMarkerDef,
  svgDoc, glowRect, animatedLine, escXml,
  autoCardLayout, autoNodeCard, fitText, multilineText,
} from "./design-tokens";

/**
 * Render the platform overview SVG.
 *
 * Central hub ("Adcelerate") with system nodes arranged on a circle around it.
 * Each system node auto-sizes to fit its name (1–2 lines bold) plus a short
 * tagline (1–3 lines secondary). The orbit radius is computed from the actual
 * node dimensions so nothing collides with the hub or overflows the canvas.
 *
 * Canvas dimensions grow to fit the orbit + bottom badge; never clipped.
 */
export function renderPlatformSvg(systems: SystemData[], options?: { hubTagline?: string }): string {
  const w = CANVAS.width;
  const cx = w / 2;

  const count = systems.length;
  if (count === 0) {
    return svgDoc(w, 200, "", `  <text x="${cx}" y="100" text-anchor="middle" fill="${DARK.secondary}" font-family="${FONTS.body}" font-size="14">No systems registered</text>`);
  }

  // ── Per-node layouts (auto-sized) ────────────────────────────
  const nodeMaxW = 240;
  const nodeMinW = 160;
  const nodeLayouts = systems.map((sys) => {
    // Use the first sentence of the description for a clean, headline-style card.
    const desc = firstSentence(sys.description ?? "");
    return autoCardLayout({
      label: sys.name,
      description: desc,
      minWidth: nodeMinW,
      maxWidth: nodeMaxW,
      labelMaxLines: 2,
      descMaxLines: 2,
      labelSize: 13,
      descSize: 10,
      paddingX: 14,
      paddingY: 12,
      lineGap: 3,
    });
  });

  // Use uniform node dimensions = max across all so the layout is symmetric.
  const nodeW = Math.max(...nodeLayouts.map((l) => l.width));
  const nodeH = Math.max(...nodeLayouts.map((l) => l.height));

  // ── Hub layout ───────────────────────────────────────────────
  const hubMinR = 70;
  const hubTagline = options?.hubTagline ?? "AI-Powered Marketing & Media Platform";
  const hubTitleSize = 18;
  const hubTaglineSize = 10;
  const hubTaglineLines = fitText(hubTagline, 150, 3, hubTaglineSize, "normal");
  const hubInnerH = hubTitleSize + 6 + hubTaglineLines.length * (hubTaglineSize + 3);
  const hubR = Math.max(hubMinR, Math.ceil(hubInnerH / 2 + 28));

  // ── Orbit radius — guarantees no collision with hub ──────────
  // The center-to-center distance must be at least hubR + (max half-diagonal of node) + gap.
  const nodeHalfDiag = Math.sqrt((nodeW / 2) ** 2 + (nodeH / 2) ** 2);
  const minOrbit = hubR + nodeHalfDiag + 28;
  // Also require enough orbit so neighboring nodes don't touch each other.
  // Chord length between neighbors ≈ 2 * orbit * sin(angleStep/2). Need >= nodeW + 18.
  const angleStep = (2 * Math.PI) / count;
  const minChord = nodeW + 18;
  const orbitFromChord = minChord / (2 * Math.sin(angleStep / 2 || 0.0001));

  const orbitRadius = Math.max(minOrbit, orbitFromChord);

  // ── Canvas dims — grow to fit orbit + node halves + margins ─
  // Vertical margin on top + bottom; bottom slightly larger for the count badge.
  const topMargin = 40;
  const bottomMargin = 60;
  const verticalReach = orbitRadius + nodeH / 2;
  const horizontalReach = orbitRadius + nodeW / 2;
  const requiredW = (horizontalReach + 30) * 2;
  const canvasW = Math.max(w, Math.ceil(requiredW));
  const h = Math.ceil(verticalReach * 2 + topMargin + bottomMargin);
  const hubCx = canvasW / 2;
  const hubCy = topMargin + verticalReach;

  // ── Filters ──────────────────────────────────────────────────
  const systemColors = systems.map((s) => domainTagToColor(s.domainTags));
  const allColors = [...new Set([COLORS.indigo, ...systemColors])];
  const defs = [
    glowFilterDefs(allColors),
    arrowMarkerDef(DARK.secondary, "hub-arrow"),
  ].join("\n");

  const elements: string[] = [];

  // ── Hub ──────────────────────────────────────────────────────
  const hubFilterId = glowFilterId(allColors, COLORS.indigo);
  const hubTitleY = hubCy - hubTaglineLines.length * (hubTaglineSize + 3) / 2;
  const hubTaglineFirstY = hubTitleY + 6 + hubTaglineSize;

  elements.push(`  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0s" fill="freeze" />
    ${glowRect({ x: hubCx - hubR, y: hubCy - hubR, w: hubR * 2, h: hubR * 2, rx: hubR, stroke: COLORS.indigo, fill: `${COLORS.indigo}1A`, strokeWidth: 2, filterId: hubFilterId })}
    <text x="${hubCx}" y="${hubTitleY}" text-anchor="middle" fill="${DARK.text}" font-family="${FONTS.body}" font-size="${hubTitleSize}" font-weight="700">Adcelerate</text>
${multilineText({
  lines: hubTaglineLines,
  x: hubCx,
  y: hubTaglineFirstY,
  lineHeight: hubTaglineSize + 3,
  fontSize: hubTaglineSize,
  weight: "normal",
  fill: DARK.secondary,
  anchor: "middle",
})}
  </g>`);

  // ── System nodes around the orbit ────────────────────────────
  const startAngle = -Math.PI / 2; // top

  for (let i = 0; i < count; i++) {
    const sys = systems[i];
    const layout = { ...nodeLayouts[i], width: nodeW, height: nodeH };
    const color = systemColors[i];
    const filterId = glowFilterId(allColors, color);
    const angle = startAngle + i * angleStep;
    const nodeCx = hubCx + orbitRadius * Math.cos(angle);
    const nodeCy = hubCy + orbitRadius * Math.sin(angle);
    const nx = nodeCx - nodeW / 2;
    const ny = nodeCy - nodeH / 2;
    const delay = 0.5 + i * ANIM.staggerStep;

    // Connection from hub edge to node edge.
    const lineAngle = Math.atan2(nodeCy - hubCy, nodeCx - hubCx);
    const lineX1 = hubCx + (hubR + 4) * Math.cos(lineAngle);
    const lineY1 = hubCy + (hubR + 4) * Math.sin(lineAngle);
    // Stop the line at the node's bounding-box edge along the angle.
    const dx = Math.cos(lineAngle);
    const dy = Math.sin(lineAngle);
    // Compute scale to box edge: t = min(|halfW/dx|, |halfH/dy|)
    const tBox = Math.min(
      Math.abs(dx) > 1e-6 ? Math.abs(nodeW / 2 / dx) : Number.POSITIVE_INFINITY,
      Math.abs(dy) > 1e-6 ? Math.abs(nodeH / 2 / dy) : Number.POSITIVE_INFINITY,
    );
    const lineX2 = nodeCx - dx * (tBox + 4);
    const lineY2 = nodeCy - dy * (tBox + 4);

    elements.push(
      animatedLine({
        x1: lineX1,
        y1: lineY1,
        x2: lineX2,
        y2: lineY2,
        color,
        markerId: "hub-arrow",
        delay: delay - 0.15,
      }),
    );

    elements.push(
      autoNodeCard({
        x: nx,
        y: ny,
        layout,
        color,
        filterId,
        delay,
      }),
    );
  }

  // ── Bottom badge: "N systems registered" ─────────────────────
  elements.push(`  <text x="${hubCx}" y="${h - 24}" text-anchor="middle" fill="${DARK.secondary}" font-family="${FONTS.body}" font-size="11" opacity="0">
    <animate attributeName="opacity" from="0" to="0.7" dur="${ANIM.fadeIn.dur}" begin="${0.5 + count * ANIM.staggerStep + 0.5}s" fill="freeze" />
    ${escXml(`${count} system${count === 1 ? "" : "s"} registered`)}
  </text>`);

  return svgDoc(canvasW, h, defs, elements.join("\n"));
}

/** Take the first sentence; tolerant of missing trailing period. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const m = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return m ? m[1] : trimmed;
}

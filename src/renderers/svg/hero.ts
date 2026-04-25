import {
  CANVAS, DARK, FONTS, ANIM,
  domainTagToColor, glowFilterDefs, glowFilterId,
  svgDoc, titleText, accentLine, escXml,
  estimateTextWidth, fitText, shrinkToFit, multilineText,
} from "./design-tokens";

/**
 * Render a hero banner SVG.
 *
 * Layout (top → bottom):
 *   • title     — auto-shrink fontSize to fit canvas (32 → 22 min)
 *   • accent    — short horizontal line beneath title
 *   • tagline   — wrapped to up to 2 lines at 14–16px
 *   • tag pills — wrapped to multiple rows; never overflow horizontally
 *
 * Canvas height grows automatically to accommodate tagline lines + tag rows
 * so nothing is clipped. Width is fixed at CANVAS.width (800) by design.
 */
export function renderHeroSvg(
  name: string,
  tagline: string,
  color: string,
  tags?: string[],
): string {
  const w = CANVAS.width;
  const cx = w / 2;
  const sideMargin = 40;
  const innerW = w - sideMargin * 2;

  const accentColor = tags?.length ? domainTagToColor(tags) : color;
  const usedColors = [color, accentColor];

  // ── Title sizing ─────────────────────────────────────────────
  const titleSize = shrinkToFit(name, innerW, 32, 22, "bold");

  // ── Tagline wrapping ─────────────────────────────────────────
  const taglineSize = 15;
  const taglineLineH = taglineSize + 6;
  const taglineLines = fitText(tagline, innerW, 2, taglineSize, "normal");

  // ── Tag pill rows ────────────────────────────────────────────
  const pillH = 22;
  const pillPadX = 10;
  const pillFontSize = 10;
  const pillGap = 8;
  const pillRowGap = 6;

  let pillRows: { tag: string; w: number; color: string }[][] = [];
  if (tags?.length) {
    const measured = tags.map((t) => ({
      tag: t,
      color: domainTagToColor([t]),
      w: Math.ceil(estimateTextWidth(t, pillFontSize, "normal")) + pillPadX * 2,
    }));
    let row: typeof measured = [];
    let rowW = 0;
    for (const p of measured) {
      const next = rowW + (row.length > 0 ? pillGap : 0) + p.w;
      if (next > innerW && row.length > 0) {
        pillRows.push(row);
        row = [p];
        rowW = p.w;
      } else {
        row.push(p);
        rowW = next;
      }
    }
    if (row.length > 0) pillRows.push(row);
  }

  // ── Vertical layout — compute Y positions and total height ──
  const titleY = 28 + titleSize; // title baseline (room above for visual breath)
  const accentY = titleY + 14;
  const taglineFirstY = accentY + 18 + taglineSize;
  const taglineBlockBottom = taglineFirstY + (taglineLines.length - 1) * taglineLineH;
  const pillsTopGap = pillRows.length > 0 ? 14 : 0;
  const pillsTop = taglineBlockBottom + pillsTopGap;
  const pillsBlockH = pillRows.length > 0 ? pillRows.length * pillH + (pillRows.length - 1) * pillRowGap : 0;
  const bottomMargin = 24;
  const h = Math.max(200, Math.ceil(pillsTop + pillsBlockH + bottomMargin));

  // ── Defs (glow + breathing) ──────────────────────────────────
  const defs = [
    glowFilterDefs(usedColors),
    `    <filter id="breathe-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
      <feFlood flood-color="${color}" flood-opacity="0.25" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>`,
  ].join("\n");
  const titleFilterId = glowFilterId(usedColors, color);

  // ── Tag pill SVG ─────────────────────────────────────────────
  let tagPills = "";
  if (pillRows.length > 0) {
    const rowSvgs: string[] = [];
    for (let r = 0; r < pillRows.length; r++) {
      const row = pillRows[r];
      const totalW = row.reduce((acc, p, i) => acc + p.w + (i > 0 ? pillGap : 0), 0);
      let px = cx - totalW / 2;
      const py = pillsTop + r * (pillH + pillRowGap);
      for (let i = 0; i < row.length; i++) {
        const p = row[i];
        rowSvgs.push(`  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="${0.8 + r * 0.2 + i * 0.1}s" fill="${ANIM.fadeIn.fill}" />
    <rect x="${px}" y="${py}" width="${p.w}" height="${pillH}" rx="11" fill="${p.color}18" stroke="${p.color}" stroke-width="1" />
    <text x="${px + p.w / 2}" y="${py + pillH / 2 + 3.5}" text-anchor="middle" fill="${p.color}" font-family="${FONTS.body}" font-size="${pillFontSize}" font-weight="500">${escXml(p.tag)}</text>
  </g>`);
        px += p.w + pillGap;
      }
    }
    tagPills = rowSvgs.join("\n");
  }

  const body = [
    titleText({ x: cx, y: titleY, text: name, size: titleSize, color: DARK.text, filterId: titleFilterId, delay: 0 }),
    accentLine({ cx, y: accentY, width: 120, color: accentColor, delay: ANIM.staggerStep }),
    multilineText({
      lines: taglineLines,
      x: cx,
      y: taglineFirstY,
      lineHeight: taglineLineH,
      fontSize: taglineSize,
      weight: "normal",
      fill: DARK.secondary,
      anchor: "middle",
      delay: ANIM.staggerStep * 2,
      fadeIn: true,
    }),
    tagPills,
  ]
    .filter(Boolean)
    .join("\n");

  return svgDoc(w, h, defs, body);
}

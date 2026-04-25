import {
  CANVAS, DARK, FONTS, ANIM,
  glowFilterDefs, glowFilterId, arrowMarkerDef,
  svgDoc, animatedLine, autoCardLayout, autoNodeCard,
  estimateTextWidth, fitText,
} from "./design-tokens";

/**
 * Render a pipeline SVG.
 *
 * Each stage is rendered as a card sized to its longest label (with min/max
 * bounds). If the resulting cards-row would exceed the canvas width, the
 * pipeline switches to a multi-row grid layout (left-to-right, top-to-bottom)
 * with arrows wrapping at row breaks.
 *
 * Canvas height grows to accommodate all rows + the title.
 */
export function renderPipelineSvg(
  systemName: string,
  stages: string[],
  color: string,
): string {
  const w = CANVAS.width;
  const sideMargin = 30;
  const innerW = w - sideMargin * 2;
  const titleHeight = 56; // space reserved at top for title
  const rowGap = 32;
  const colGap = 40;

  if (stages.length === 0) {
    return svgDoc(
      w,
      200,
      "",
      `  <text x="${w / 2}" y="100" text-anchor="middle" fill="${DARK.secondary}" font-family="${FONTS.body}" font-size="14">No pipeline stages defined</text>`,
    );
  }

  const usedColors = [color];
  const filterId = glowFilterId(usedColors, color);

  // ── Pre-measure each stage and pick a uniform card size ──────
  // Cards look cleaner at a uniform width, so we size by the widest stage label.
  const labelMaxW = 160; // upper bound per card
  const labelMinW = 110;
  const layouts = stages.map((label) =>
    autoCardLayout({
      label,
      minWidth: labelMinW,
      maxWidth: labelMaxW,
      labelMaxLines: 2,
      descMaxLines: 0,
      labelSize: 12,
      paddingX: 12,
      paddingY: 14,
    }),
  );
  const cardW = Math.max(labelMinW, ...layouts.map((l) => l.width));
  const cardH = Math.max(60, ...layouts.map((l) => l.height));

  // ── Decide row layout: how many cards per row fit in innerW? ─
  const cardsPerRow = Math.max(1, Math.floor((innerW + colGap) / (cardW + colGap)));
  const rowsCount = Math.ceil(stages.length / cardsPerRow);
  const lastRowCount = stages.length - (rowsCount - 1) * cardsPerRow;

  const rowsTotalH = rowsCount * cardH + (rowsCount - 1) * rowGap;
  const h = titleHeight + rowsTotalH + 32; // bottom margin

  const rowStartY = titleHeight;

  const defs = [
    glowFilterDefs(usedColors),
    arrowMarkerDef(color, "pipe-arrow"),
  ].join("\n");

  const elements: string[] = [];

  // ── Title ────────────────────────────────────────────────────
  const titleText = `${systemName} Pipeline`;
  const titleSize = 16;
  const titleLines = fitText(titleText, innerW, 1, titleSize, "bold");
  elements.push(`  <text x="${w / 2}" y="34" text-anchor="middle" fill="${DARK.text}" font-family="${FONTS.body}" font-size="${titleSize}" font-weight="600" opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="${ANIM.fadeIn.dur}" begin="0s" fill="${ANIM.fadeIn.fill}" />
    ${titleLines[0]}
  </text>`);

  // ── Cards + arrows ───────────────────────────────────────────
  const stagger = 0.4;

  for (let i = 0; i < stages.length; i++) {
    const row = Math.floor(i / cardsPerRow);
    const colInRow = i % cardsPerRow;
    const cardsInRow = row === rowsCount - 1 ? lastRowCount : cardsPerRow;
    const rowWidth = cardsInRow * cardW + (cardsInRow - 1) * colGap;
    const rowStartX = (w - rowWidth) / 2;

    const x = rowStartX + colInRow * (cardW + colGap);
    const y = rowStartY + row * (cardH + rowGap);
    const delay = (i + 1) * stagger;

    // Connection arrow to the next card in the same row.
    if (i < stages.length - 1 && colInRow < cardsInRow - 1) {
      elements.push(
        animatedLine({
          x1: x + cardW + 4,
          y1: y + cardH / 2,
          x2: x + cardW + colGap - 4,
          y2: y + cardH / 2,
          color,
          markerId: "pipe-arrow",
          delay: delay + 0.2,
        }),
      );
    } else if (i < stages.length - 1) {
      // Row-wrap arrow: drop down to next row's first card, then point right.
      const nextRow = row + 1;
      const nextCardsInRow = nextRow === rowsCount - 1 ? lastRowCount : cardsPerRow;
      const nextRowWidth = nextCardsInRow * cardW + (nextCardsInRow - 1) * colGap;
      const nextRowStartX = (w - nextRowWidth) / 2;
      const nextX = nextRowStartX;
      const nextY = rowStartY + nextRow * (cardH + rowGap);

      // Right edge of current card → down → left to next card's left edge.
      const elbowX1 = x + cardW + 12;
      const midY = y + cardH + rowGap / 2;
      const elbowX2 = nextX - 12;
      // Use 3 short animated segments to approximate the elbow.
      elements.push(
        animatedLine({ x1: x + cardW + 4, y1: y + cardH / 2, x2: elbowX1, y2: y + cardH / 2, color, delay: delay + 0.2 }),
        animatedLine({ x1: elbowX1, y1: y + cardH / 2, x2: elbowX1, y2: midY, color, delay: delay + 0.25 }),
        animatedLine({ x1: elbowX1, y1: midY, x2: elbowX2, y2: midY, color, delay: delay + 0.3 }),
        animatedLine({ x1: elbowX2, y1: midY, x2: elbowX2, y2: nextY + cardH / 2, color, delay: delay + 0.35 }),
        animatedLine({ x1: elbowX2, y1: nextY + cardH / 2, x2: nextX - 4, y2: nextY + cardH / 2, color, markerId: "pipe-arrow", delay: delay + 0.4 }),
      );
    }

    // Stage card. Use a per-stage layout but force the uniform width / height.
    const layout = { ...layouts[i], width: cardW, height: cardH };
    elements.push(
      autoNodeCard({
        x,
        y,
        layout,
        color,
        filterId,
        delay,
      }),
    );
  }

  return svgDoc(w, h, defs, elements.join("\n"));
}

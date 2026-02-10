// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanelRect { x: number; y: number; w: number; h: number }
export interface LayoutPreset { id: string; label: string; panelCount: number; panels: PanelRect[] }
export interface PageFormat { id: string; label: string; ratioW: number; ratioH: number }
export interface PanelTransform { offsetX: number; offsetY: number; scale: number }

export type BubbleType = 'speech' | 'thought' | 'shout' | 'narration' | 'whisper';
export type TailDirection = 'bottom-left' | 'bottom-right' | 'none';

export interface SpeechBubble {
  id: string;
  panelIndex: number;
  type: BubbleType;
  text: string;
  position: string;
  freePosition?: { nx: number; ny: number };
  tailDirection: TailDirection;
  fontSize: number;
}

// ---------------------------------------------------------------------------
// Bubble position grid (3x3)
// ---------------------------------------------------------------------------

export const BUBBLE_POS: Record<string, { nx: number; ny: number }> = {
  '0': { nx: 0.2, ny: 0.2 }, '1': { nx: 0.5, ny: 0.2 }, '2': { nx: 0.8, ny: 0.2 },
  '3': { nx: 0.2, ny: 0.5 }, '4': { nx: 0.5, ny: 0.5 }, '5': { nx: 0.8, ny: 0.5 },
  '6': { nx: 0.2, ny: 0.8 }, '7': { nx: 0.5, ny: 0.8 }, '8': { nx: 0.8, ny: 0.8 },
};

// ---------------------------------------------------------------------------
// Canvas bubble drawing helpers
// ---------------------------------------------------------------------------

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.15 : cx + bw * 0.15;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.3 : cx + bw * 0.3;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.06, cy + bh * 0.4);
    ctx.lineTo(tipX, cy + bh * 0.7);
    ctx.lineTo(baseX + bw * 0.06, cy + bh * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, bw / 2 - 1, bh / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

function drawThoughtBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  const bumps = 10;
  const rx = bw / 2;
  const ry = bh / 2;
  const br = Math.min(rx, ry) * 0.4;
  const circles: Array<{ x: number; y: number; r: number }> = [];

  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    circles.push({ x: cx + rx * 0.75 * Math.cos(a), y: cy + ry * 0.75 * Math.sin(a), r: br });
  }

  ctx.fillStyle = '#ffffff';
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke(); }

  ctx.fillStyle = '#ffffff';
  for (const c of circles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r - 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2); ctx.fill();

  if (tail !== 'none') {
    const dx = tail === 'bottom-left' ? -1 : 1;
    const sizes = [br * 0.4, br * 0.28, br * 0.18];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + dx * (bw * 0.2 + i * bw * 0.08), cy + bh * 0.5 + i * bh * 0.1, sizes[i], 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}

function drawShoutBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  const spikes = 14;
  const outerRx = bw / 2;
  const outerRy = bh / 2;
  const innerRx = outerRx * 0.78;
  const innerRy = outerRy * 0.78;

  const drawSpiky = (shrink: number) => {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const isO = i % 2 === 0;
      const px = cx + ((isO ? outerRx : innerRx) - shrink) * Math.cos(a);
      const py = cy + ((isO ? outerRy : innerRy) - shrink) * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  drawSpiky(0);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.stroke();

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.1 : cx + bw * 0.1;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.35 : cx + bw * 0.35;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.04, cy + bh * 0.35);
    ctx.lineTo(tipX, cy + bh * 0.75);
    ctx.lineTo(baseX + bw * 0.04, cy + bh * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.stroke();
    drawSpiky(3);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

function drawNarrationBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, _tail: TailDirection): void {
  const r = Math.min(bw, bh) * 0.1;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, r);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
}

function drawWhisperBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, bw: number, bh: number, tail: TailDirection): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
  ctx.setLineDash([]);

  if (tail !== 'none') {
    const baseX = tail === 'bottom-left' ? cx - bw * 0.15 : cx + bw * 0.15;
    const tipX = tail === 'bottom-left' ? cx - bw * 0.3 : cx + bw * 0.3;
    ctx.beginPath();
    ctx.moveTo(baseX - bw * 0.06, cy + bh * 0.4);
    ctx.lineTo(tipX, cy + bh * 0.7);
    ctx.lineTo(baseX + bw * 0.06, cy + bh * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, bw / 2 - 1, bh / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

const BUBBLE_DRAW: Record<BubbleType, typeof drawSpeechBubble> = {
  speech: drawSpeechBubble, thought: drawThoughtBubble, shout: drawShoutBubble,
  narration: drawNarrationBubble, whisper: drawWhisperBubble,
};

export function drawBubbleOnCanvas(
  ctx: CanvasRenderingContext2D,
  bubble: SpeechBubble,
  pr: { px: number; py: number; pw: number; ph: number },
): void {
  const pos = bubble.freePosition ?? BUBBLE_POS[bubble.position] ?? { nx: 0.5, ny: 0.2 };
  const cx = pr.px + pos.nx * pr.pw;
  const cy = pr.py + pos.ny * pr.ph;
  const fs = bubble.fontSize || 16;
  const isShout = bubble.type === 'shout';
  const isWhisper = bubble.type === 'whisper';

  ctx.font = `${isShout ? 'bold ' : ''}${isWhisper ? Math.round(fs * 0.85) : fs}px "Comic Sans MS", sans-serif`;
  const maxTW = pr.pw * 0.4;
  const lines = wrapText(ctx, bubble.text || ' ', maxTW);
  const lh = fs * 1.3;
  const tbh = lines.length * lh;
  const tbw = Math.max(...lines.map((l) => ctx.measureText(l).width), fs * 2);
  const padX = fs * 1.2;
  const padY = fs * 0.8;
  const bw = tbw + padX * 2;
  const bh = tbh + padY * 2;

  BUBBLE_DRAW[bubble.type](ctx, cx, cy, bw, bh, bubble.tailDirection);

  ctx.fillStyle = '#000000';
  ctx.font = `${isShout ? 'bold ' : ''}${isWhisper ? Math.round(fs * 0.85) : fs}px "Comic Sans MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const startY = cy - tbh / 2 + lh / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, startY + i * lh);
  }
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { SpeechBubble, BubbleType } from './canvas-renderer';

// ---------------------------------------------------------------------------
// Bubble type options
// ---------------------------------------------------------------------------

export const BUBBLE_TYPES: Array<{ type: BubbleType; label: string }> = [
  { type: 'speech', label: 'Speech' },
  { type: 'thought', label: 'Thought' },
  { type: 'shout', label: 'Shout' },
  { type: 'narration', label: 'Narrate' },
  { type: 'whisper', label: 'Whisper' },
];

// ---------------------------------------------------------------------------
// BubbleCard sub-component (dark theme)
// ---------------------------------------------------------------------------

export interface BubbleCardProps {
  bubble: SpeechBubble;
  maxPanel: number;
  onUpdate: (b: SpeechBubble) => void;
  onDelete: () => void;
}

export function BubbleCard({ bubble, maxPanel, onUpdate, onDelete }: BubbleCardProps) {
  const set = <K extends keyof SpeechBubble>(k: K, v: SpeechBubble[K]) =>
    onUpdate({ ...bubble, [k]: v });

  const setGridPosition = (pos: string) => {
    onUpdate({ ...bubble, position: pos, freePosition: undefined });
  };

  return (
    <div className="rounded-xl border border-zinc-700/40 bg-zinc-800/40 p-3 space-y-2.5">
      {/* Panel selector + delete */}
      <div className="flex items-center justify-between">
        <select
          value={bubble.panelIndex}
          onChange={(e) => set('panelIndex', Number(e.target.value))}
          className="text-[11px] rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label="Panel"
        >
          {Array.from({ length: maxPanel + 1 }, (_, i) => (
            <option key={i} value={i}>Panel {i + 1}</option>
          ))}
        </select>
        <button type="button" onClick={onDelete} className="text-[11px] text-zinc-500 hover:text-red-400 px-2 py-0.5 rounded-md hover:bg-red-500/10 transition-colors" aria-label="Delete bubble">
          Remove
        </button>
      </div>

      {/* Bubble type */}
      <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
        {BUBBLE_TYPES.map((bt) => (
          <button
            key={bt.type}
            type="button"
            onClick={() => set('type', bt.type)}
            className={cn(
              'flex-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-colors text-center',
              bubble.type === bt.type ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200',
            )}
            aria-label={`Bubble type: ${bt.label}`}
            aria-pressed={bubble.type === bt.type}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={bubble.text}
        onChange={(e) => set('text', e.target.value)}
        rows={2}
        placeholder="Type dialogue..."
        className="w-full text-[11px] rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 placeholder:text-zinc-600 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        aria-label="Bubble text"
      />

      {/* Position grid + tail + font size */}
      <div className="flex items-start gap-4">
        {/* 3x3 position grid */}
        <div>
          <span className="text-[10px] text-zinc-500 block mb-1 font-medium">Position</span>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGridPosition(String(i))}
                className={cn(
                  'size-4 rounded-full transition-all',
                  !bubble.freePosition && bubble.position === String(i) ? 'bg-violet-500 shadow-sm shadow-violet-500/30' : 'bg-zinc-700/50 hover:bg-zinc-600/60',
                )}
                aria-label={`Position ${i}`}
                aria-pressed={!bubble.freePosition && bubble.position === String(i)}
              />
            ))}
          </div>
          {bubble.freePosition && (
            <span className="text-[9px] text-violet-400 mt-1 block font-medium">Custom pos</span>
          )}
        </div>

        {/* Tail + font size stacked */}
        <div className="flex-1 space-y-2">
          <div>
            <span className="text-[10px] text-zinc-500 block mb-1 font-medium">Tail</span>
            <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
              {([
                { dir: 'bottom-left' as const, icon: '\u2199', label: 'Left' },
                { dir: 'bottom-right' as const, icon: '\u2198', label: 'Right' },
                { dir: 'none' as const, icon: '\u2014', label: 'None' },
              ]).map((td) => (
                <button
                  key={td.dir}
                  type="button"
                  onClick={() => set('tailDirection', td.dir)}
                  className={cn(
                    'flex-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-colors text-center',
                    bubble.tailDirection === td.dir ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200',
                  )}
                  aria-label={`Tail: ${td.label}`}
                  aria-pressed={bubble.tailDirection === td.dir}
                >
                  {td.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-medium">Font size</span>
              <span className="text-[10px] text-zinc-400 font-mono tabular-nums">{bubble.fontSize}px</span>
            </div>
            <input
              type="range" min={12} max={32} value={bubble.fontSize}
              onChange={(e) => set('fontSize', Number(e.target.value))}
              className="w-full h-1.5 accent-violet-500 rounded-full" aria-label="Font size"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

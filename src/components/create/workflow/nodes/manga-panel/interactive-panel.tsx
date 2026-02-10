'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { PanelRect, PanelTransform, SpeechBubble } from './canvas-renderer';
import { BUBBLE_POS } from './canvas-renderer';

// ---------------------------------------------------------------------------
// Interactive Panel Preview (draggable images + bubbles after execution)
// ---------------------------------------------------------------------------

export interface InteractivePanelProps {
  panelIndex: number;
  panel: PanelRect;
  panelSource?: string;
  transform: PanelTransform;
  bubbles: SpeechBubble[];
  gutterWidth: number;
  borderWidth: number;
  borderColor: string;
  readingOrder: string;
  readOrderNum: number;
  onTransformChange: (t: PanelTransform) => void;
  onBubbleDrag: (bubbleId: string, nx: number, ny: number) => void;
}

export function InteractivePanel({
  panelIndex, panel, panelSource, transform, bubbles, gutterWidth,
  borderWidth, borderColor, readingOrder, readOrderNum,
  onTransformChange, onBubbleDrag,
}: InteractivePanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<{ type: 'image' | 'bubble'; bubbleId?: string; startX: number; startY: number; startOx: number; startOy: number } | null>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent, type: 'image' | 'bubble', bubbleId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startOx = type === 'image' ? transform.offsetX : 0;
    const startOy = type === 'image' ? transform.offsetY : 0;
    setDragging({ type, bubbleId, startX: e.clientX, startY: e.clientY, startOx, startOy });
  }, [transform.offsetX, transform.offsetY]);

  React.useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      if (dragging.type === 'image') {
        onTransformChange({ ...transform, offsetX: dragging.startOx + dx * 0.5, offsetY: dragging.startOy + dy * 0.5 });
      } else if (dragging.type === 'bubble' && dragging.bubbleId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const nx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
        const ny = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
        onBubbleDrag(dragging.bubbleId, nx, ny);
      }
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, transform, onTransformChange, onBubbleDrag]);

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(3, (transform.scale || 1) + delta));
    onTransformChange({ ...transform, scale: newScale });
  }, [transform, onTransformChange]);

  return (
    <div
      ref={containerRef}
      className="absolute overflow-hidden"
      style={{
        left: `${panel.x * 100}%`, top: `${panel.y * 100}%`,
        width: `${panel.w * 100}%`, height: `${panel.h * 100}%`,
        padding: `${Math.max(gutterWidth / 4, 1)}px`,
      }}
    >
      <div
        className={cn('w-full h-full relative overflow-hidden', panelSource && 'cursor-grab', dragging?.type === 'image' && 'cursor-grabbing')}
        style={{ border: `${Math.max(borderWidth / 4, 1)}px solid ${borderColor}` }}
        onMouseDown={panelSource ? (e) => handleMouseDown(e, 'image') : undefined}
        onWheel={panelSource ? handleWheel : undefined}
      >
        {panelSource ? (
          <img
            src={panelSource}
            alt={`Panel ${panelIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{
              transform: `translate(${(transform.offsetX || 0) * 0.1}%, ${(transform.offsetY || 0) * 0.1}%) scale(${transform.scale || 1})`,
              transformOrigin: 'center',
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800/40">
            <span className="text-[10px] text-zinc-500 font-mono">{panelIndex + 1}</span>
          </div>
        )}

        {/* Reading order badge */}
        <span
          className="absolute text-[7px] font-bold text-violet-400/70 z-10"
          style={{ [readingOrder === 'rtl' ? 'right' : 'left']: '2px', top: '1px' }}
        >
          {readOrderNum + 1}
        </span>

        {/* Draggable bubble dots */}
        {bubbles.map((b) => {
          const pos = b.freePosition ?? BUBBLE_POS[b.position] ?? { nx: 0.5, ny: 0.2 };
          return (
            <div
              key={b.id}
              className="absolute size-3 rounded-full bg-white/90 border-2 border-violet-500 cursor-move z-20 hover:scale-125 transition-transform"
              style={{ left: `${pos.nx * 100}%`, top: `${pos.ny * 100}%`, transform: 'translate(-50%,-50%)' }}
              onMouseDown={(e) => handleMouseDown(e, 'bubble', b.id)}
              title={`${b.type}: "${b.text.slice(0, 20)}${b.text.length > 20 ? '...' : ''}"`}
            />
          );
        })}
      </div>
    </div>
  );
}

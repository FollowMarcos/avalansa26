'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Segmented control helper
// ---------------------------------------------------------------------------

interface SegProps {
  items: Array<{ id: string; label: string; title?: string }>;
  value: string;
  onChange: (id: string) => void;
  label: string;
}

export function Seg({ items, value, onChange, label }: SegProps) {
  return (
    <div className="flex rounded-lg bg-zinc-800/60 p-0.5" role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id} type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'flex-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors text-center',
            value === item.id ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200',
          )}
          role="radio"
          aria-checked={value === item.id}
          title={item.title}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

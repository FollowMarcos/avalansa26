'use client';

import * as React from 'react';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

/**
 * Animated delete button with confirmation state.
 * First click expands to show confirmation, second click deletes.
 * Click cancel or outside to reset.
 * Uses CSS transitions on transform/opacity only for performance.
 */
export function DeleteButton({ onDelete, className }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Reset state
  const reset = React.useCallback(() => {
    setIsConfirming(false);
  }, []);

  // Start confirmation mode
  const handleInitialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  // Confirm deletion
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
    onDelete();
  };

  // Cancel confirmation
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
  };

  return (
    <div className="flex items-center gap-1 h-6">
      {/* Initial delete button - always rendered, transforms when confirming */}
      <button
        onClick={isConfirming ? handleCancel : handleInitialClick}
        aria-label={isConfirming ? "Cancel deletion" : "Delete from canvas"}
        className={cn(
          'size-6 rounded-full flex items-center justify-center shadow-sm shrink-0',
          'transition-all duration-150 ease-out active:scale-90',
          'focus-visible:ring-2 focus-visible:ring-ring',
          isConfirming
            ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            : 'bg-red-500/90 hover:bg-red-500 text-white',
          className
        )}
      >
        {isConfirming ? (
          <X className="size-3 text-zinc-600 dark:text-zinc-400" aria-hidden="true" strokeWidth={2.5} />
        ) : (
          <Trash2 className="size-3" aria-hidden="true" strokeWidth={2.5} />
        )}
      </button>

      {/* Confirm delete button - slides in with transform */}
      <button
        onClick={handleConfirm}
        aria-label="Confirm deletion"
        aria-hidden={!isConfirming}
        tabIndex={isConfirming ? 0 : -1}
        className={cn(
          'h-6 px-2 rounded-full flex items-center gap-1',
          'bg-red-500 hover:bg-red-600 shadow-sm',
          'text-white text-[11px] font-medium whitespace-nowrap',
          'transition-all duration-150 ease-out active:scale-95',
          'focus-visible:ring-2 focus-visible:ring-ring',
          isConfirming
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2 pointer-events-none absolute'
        )}
      >
        <Trash2 className="size-3" aria-hidden="true" strokeWidth={2.5} />
        <span>Delete</span>
      </button>
    </div>
  );
}

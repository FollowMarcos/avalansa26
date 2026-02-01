'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <AnimatePresence mode="wait">
      {!isConfirming ? (
        // Initial delete button
        <motion.button
          key="delete"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          onClick={handleInitialClick}
          aria-label="Delete from canvas"
          className={cn(
            'size-6 rounded-full bg-red-500/90 flex items-center justify-center text-white',
            'hover:bg-red-500 transition-colors shadow-sm',
            className
          )}
        >
          <Trash2 className="size-3" aria-hidden="true" strokeWidth={2.5} />
        </motion.button>
      ) : (
        // Confirmation state
        <motion.div
          key="confirm"
          initial={{ opacity: 0, width: 24 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 24 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-1 h-6 overflow-hidden"
        >
          {/* Cancel button */}
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            aria-label="Cancel deletion"
            className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm shrink-0"
          >
            <X className="size-3 text-zinc-600 dark:text-zinc-400" aria-hidden="true" strokeWidth={2.5} />
          </motion.button>

          {/* Confirm delete button */}
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirm}
            aria-label="Confirm deletion"
            className={cn(
              'h-6 px-2 rounded-full flex items-center gap-1',
              'bg-red-500 hover:bg-red-600 transition-colors shadow-sm',
              'text-white text-[11px] font-medium whitespace-nowrap'
            )}
          >
            <Trash2 className="size-3" aria-hidden="true" strokeWidth={2.5} />
            <span>Delete</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

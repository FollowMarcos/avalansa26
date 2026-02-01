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
 * Auto-resets after timeout or when clicking cancel.
 */
export function DeleteButton({ onDelete, className }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset state
  const reset = React.useCallback(() => {
    setIsConfirming(false);
    setCountdown(3);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Start confirmation mode
  const handleInitialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
    setCountdown(3);
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

  // Countdown timer and auto-delete when reaching 0
  React.useEffect(() => {
    if (!isConfirming) return;

    if (countdown <= 0) {
      // Auto-delete when countdown reaches 0
      reset();
      onDelete();
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConfirming, countdown, onDelete, reset]);

  // Reset when component unmounts or loses focus
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
            'size-8 rounded-md bg-red-500/90 flex items-center justify-center',
            'hover:bg-red-500 transition-colors',
            className
          )}
        >
          <Trash2 className="size-4 text-white" aria-hidden="true" />
        </motion.button>
      ) : (
        // Confirmation state
        <motion.div
          key="confirm"
          initial={{ opacity: 0, width: 32 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 32 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-1 h-8 overflow-hidden"
        >
          {/* Cancel button */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            aria-label="Cancel deletion"
            className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors shrink-0"
          >
            <X className="size-4 text-zinc-700" aria-hidden="true" />
          </motion.button>

          {/* Confirm delete button with countdown */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirm}
            aria-label="Confirm deletion"
            className={cn(
              'h-8 px-2.5 rounded-md flex items-center gap-1.5',
              'bg-red-500 hover:bg-red-600 transition-colors',
              'text-white text-xs font-medium whitespace-nowrap'
            )}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span>Delete</span>
            <motion.span
              key={countdown}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="size-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono"
            >
              {countdown}
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

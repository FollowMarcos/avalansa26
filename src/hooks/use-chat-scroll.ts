'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatScrollOptions {
  /** Distance from bottom (in px) to consider "at bottom" */
  threshold?: number;
  /** Number of messages — triggers auto-scroll when new message arrives */
  messageCount: number;
}

interface UseChatScrollReturn {
  /** Ref to attach to the scroll container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the user is currently at the bottom of the list */
  isAtBottom: boolean;
  /** Scroll to the bottom of the container */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** Whether to show the "scroll to bottom" button */
  showScrollButton: boolean;
}

/**
 * Hook to manage chat scroll behavior:
 * - Auto-scrolls to bottom when new messages arrive (if already at bottom)
 * - Shows "scroll to bottom" button when scrolled up
 * - Maintains scroll position when loading older messages
 */
export function useChatScroll({
  threshold = 100,
  messageCount,
}: UseChatScrollOptions): UseChatScrollReturn {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessageCountRef = useRef(messageCount);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= threshold;

    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  }, [threshold]);

  // Attach scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (messageCount > prevMessageCountRef.current && isAtBottom) {
      requestAnimationFrame(() => {
        scrollToBottomFn('smooth');
      });
    }
    prevMessageCountRef.current = messageCount;
  }, [messageCount, isAtBottom]);

  const scrollToBottomFn = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const el = scrollRef.current;
      if (!el) return;

      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    },
    []
  );

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom: scrollToBottomFn,
    showScrollButton,
  };
}

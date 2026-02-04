'use client';

import * as React from 'react';
import { useStore, type ReactFlowState } from '@xyflow/react';

interface HelperLinesProps {
  horizontal?: number;
  vertical?: number;
}

const transformSelector = (state: ReactFlowState) => state.transform;

/**
 * HelperLines component displays visual alignment guides when dragging nodes.
 * Shows horizontal and/or vertical lines when a node aligns with another node's position.
 */
export function HelperLines({ horizontal, vertical }: HelperLinesProps) {
  const transform = useStore(transformSelector);

  // Calculate line positions based on current viewport transform
  // transform = [x, y, zoom]
  const [tx, ty, zoom] = transform;

  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 5,
  };

  const horizontalLineStyle: React.CSSProperties = {
    ...lineStyle,
    left: 0,
    right: 0,
    height: 1,
    borderTop: '1px dashed hsl(var(--primary))',
    opacity: 0.8,
  };

  const verticalLineStyle: React.CSSProperties = {
    ...lineStyle,
    top: 0,
    bottom: 0,
    width: 1,
    borderLeft: '1px dashed hsl(var(--primary))',
    opacity: 0.8,
  };

  return (
    <>
      {horizontal !== undefined && (
        <div
          style={{
            ...horizontalLineStyle,
            top: horizontal * zoom + ty,
          }}
          aria-hidden="true"
        />
      )}
      {vertical !== undefined && (
        <div
          style={{
            ...verticalLineStyle,
            left: vertical * zoom + tx,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

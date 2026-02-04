/**
 * Group utility functions and constants
 */

import type { GroupBounds } from "@/types/canvas";
import type { Node } from "@xyflow/react";
import type { ImageNodeData } from "@/types/canvas";

// Default node dimensions (fallback if measured dimensions unavailable)
export const DEFAULT_NODE_WIDTH = 240;
export const DEFAULT_NODE_HEIGHT = 300;

// Group padding and title height
export const GROUP_PADDING = 40;
export const GROUP_TITLE_HEIGHT = 32;
export const GROUP_COLLAPSED_HEIGHT = 40;

/**
 * Get the actual dimensions of a node (uses measured if available, otherwise calculates from aspect ratio)
 */
export function getNodeDimensions(node: Node<ImageNodeData>): { width: number; height: number } {
  // Use measured dimensions if available (React Flow provides these after render)
  if (node.measured?.width && node.measured?.height) {
    return { width: node.measured.width, height: node.measured.height };
  }

  // Calculate from aspect ratio like image-node.tsx does
  const aspectRatio = node.data.settings?.aspectRatio || "1:1";
  const [w, h] = aspectRatio.split(":").map(Number);
  const baseWidth = 240;
  const aspectHeight = Math.round((baseWidth / (w || 1)) * (h || 1));
  const clampedHeight = Math.min(400, Math.max(160, aspectHeight));
  const adjustedWidth = Math.round((clampedHeight / (h || 1)) * (w || 1));
  const finalWidth = Math.min(320, Math.max(160, adjustedWidth));
  const finalHeight = Math.round((finalWidth / (w || 1)) * (h || 1));

  // Add ~50px for the info section below the image
  return { width: finalWidth, height: finalHeight + 50 };
}

// ComfyUI-inspired color palette for groups
export const GROUP_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Cyan", value: "#06b6d4" },
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];

/**
 * Get the center point of a node (uses actual dimensions)
 */
export function getNodeCenter(node: Node<ImageNodeData>): { x: number; y: number } {
  const { width, height } = getNodeDimensions(node);
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: GroupBounds
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Check if a node's center is within a group's bounds
 */
export function isNodeInBounds(
  node: Node<ImageNodeData>,
  bounds: GroupBounds
): boolean {
  const center = getNodeCenter(node);
  return isPointInBounds(center, bounds);
}

/**
 * Calculate bounds that encompass a set of nodes (uses actual dimensions)
 */
export function calculateBoundsForNodes(
  nodes: Node<ImageNodeData>[]
): GroupBounds {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 300, height: 200 };
  }

  const minX = Math.min(...nodes.map((n) => n.position.x)) - GROUP_PADDING;
  const minY =
    Math.min(...nodes.map((n) => n.position.y)) -
    GROUP_PADDING -
    GROUP_TITLE_HEIGHT;
  const maxX =
    Math.max(...nodes.map((n) => {
      const { width } = getNodeDimensions(n);
      return n.position.x + width;
    })) + GROUP_PADDING;
  const maxY =
    Math.max(...nodes.map((n) => {
      const { height } = getNodeDimensions(n);
      return n.position.y + height;
    })) + GROUP_PADDING;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get a random color from the palette
 */
export function getRandomGroupColor(): string {
  const index = Math.floor(Math.random() * GROUP_COLORS.length);
  return GROUP_COLORS[index].value;
}

/**
 * Convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

'use client';

import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const imageGridDefinition: WorkflowNodeDefinition = {
  type: 'imageGrid',
  label: 'Image Grid',
  category: 'output',
  description: 'Combine 2-4 images into a grid collage',
  icon: 'LayoutGrid',
  inputs: [
    { id: 'image_a', label: 'Image A', type: 'image', required: true },
    { id: 'image_b', label: 'Image B', type: 'image' },
    { id: 'image_c', label: 'Image C', type: 'image' },
    { id: 'image_d', label: 'Image D', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Grid', type: 'image' },
  ],
  defaultConfig: { gap: 2, background: '#000000' },
  minWidth: 240,
};

/**
 * Draws connected images into a canvas grid and returns a data URL.
 * Layout: 1 image = full, 2 = side-by-side, 3 = 2+1, 4 = 2x2.
 */
export const imageGridExecutor: NodeExecutor = async (inputs, config) => {
  const urls = [
    inputs.image_a as string | undefined,
    inputs.image_b as string | undefined,
    inputs.image_c as string | undefined,
    inputs.image_d as string | undefined,
  ].filter(Boolean) as string[];

  if (urls.length === 0) throw new Error('At least one image is required');

  const gap = (config.gap as number) ?? 2;
  const bg = (config.background as string) || '#000000';

  // Load all images
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 50)}`));
      img.src = src;
    });

  const images = await Promise.all(urls.map(loadImage));
  const count = images.length;

  // Grid size (square canvas)
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Compute cell layout
  type Cell = { x: number; y: number; w: number; h: number };
  let cells: Cell[];

  if (count === 1) {
    cells = [{ x: 0, y: 0, w: size, h: size }];
  } else if (count === 2) {
    const half = (size - gap) / 2;
    cells = [
      { x: 0, y: 0, w: half, h: size },
      { x: half + gap, y: 0, w: half, h: size },
    ];
  } else if (count === 3) {
    const half = (size - gap) / 2;
    cells = [
      { x: 0, y: 0, w: half, h: size },
      { x: half + gap, y: 0, w: half, h: half },
      { x: half + gap, y: half + gap, w: half, h: half },
    ];
  } else {
    const half = (size - gap) / 2;
    cells = [
      { x: 0, y: 0, w: half, h: half },
      { x: half + gap, y: 0, w: half, h: half },
      { x: 0, y: half + gap, w: half, h: half },
      { x: half + gap, y: half + gap, w: half, h: half },
    ];
  }

  // Draw images with cover-fit
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const cell = cells[i];
    const scale = Math.max(cell.w / img.width, cell.h / img.height);
    const sw = cell.w / scale;
    const sh = cell.h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, cell.x, cell.y, cell.w, cell.h);
  }

  return { image: canvas.toDataURL('image/jpeg', 0.92) };
};

interface ImageGridNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageGridNode({ data, id, selected }: ImageGridNodeProps) {
  const status = data.status ?? 'idle';
  const outputImage = data.outputValues?.image as string | undefined;

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageGridDefinition.label}
      icon={<LayoutGrid className="size-4" />}
      inputs={imageGridDefinition.inputs}
      outputs={imageGridDefinition.outputs}
      minWidth={imageGridDefinition.minWidth}
    >
      <div className="space-y-2">
        {status === 'success' && outputImage ? (
          <div className="relative rounded-md overflow-hidden border border-border">
            <img
              src={outputImage}
              alt="Image grid"
              className="w-full h-32 object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-16">
            <div className="grid grid-cols-2 gap-0.5 opacity-30">
              <div className="size-6 rounded-sm bg-muted-foreground/30" />
              <div className="size-6 rounded-sm bg-muted-foreground/30" />
              <div className="size-6 rounded-sm bg-muted-foreground/30" />
              <div className="size-6 rounded-sm bg-muted-foreground/30" />
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          {status === 'idle'
            ? 'Connect 2-4 images'
            : status === 'running'
              ? 'Compositing...'
              : status === 'success'
                ? `${Object.values(data.outputValues ?? {}).length > 0 ? 'Grid ready' : ''}`
                : ''}
        </p>
      </div>
    </BaseWorkflowNode>
  );
}

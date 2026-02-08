'use client';

import * as React from 'react';
import { Columns2, GripVertical } from 'lucide-react';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const beforeAfterDefinition: WorkflowNodeDefinition = {
  type: 'beforeAfterImage',
  label: 'Before & After',
  category: 'output',
  description: 'Compare two images with an interactive slider',
  icon: 'Columns2',
  inputs: [
    { id: 'before', label: 'Before', type: 'image', required: true },
    { id: 'after', label: 'After', type: 'image', required: true },
  ],
  outputs: [],
  defaultConfig: {},
  minWidth: 350,
};

export const beforeAfterExecutor: NodeExecutor = async (inputs) => {
  const before = inputs.before as string | undefined;
  const after = inputs.after as string | undefined;
  if (!before || !after) throw new Error('Both before and after images are required');
  return { before, after };
};

interface BeforeAfterImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function BeforeAfterImageNode({ data, id, selected }: BeforeAfterImageNodeProps) {
  const status = data.status ?? 'idle';
  const beforeUrl = data.outputValues?.before as string | undefined;
  const afterUrl = data.outputValues?.after as string | undefined;
  const hasImages = status === 'success' && beforeUrl && afterUrl;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);

  const updateSlider = React.useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      updateSlider(e.clientX);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, updateSlider]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={beforeAfterDefinition.label}
      icon={<Columns2 className="size-4" />}
      inputs={beforeAfterDefinition.inputs}
      outputs={beforeAfterDefinition.outputs}
      minWidth={beforeAfterDefinition.minWidth}
    >
      {hasImages ? (
        <div
          ref={containerRef}
          className="relative rounded-md overflow-hidden border border-border select-none"
          style={{ cursor: isDragging ? 'col-resize' : undefined }}
        >
          {/* Before image (full width, bottom layer) */}
          <img
            src={beforeUrl}
            alt="Before"
            className="w-full h-auto max-h-72 object-contain bg-muted/20"
            draggable={false}
          />

          {/* After image (clipped, top layer) */}
          <img
            src={afterUrl}
            alt="After"
            className="absolute inset-0 w-full h-full object-contain bg-muted/20"
            draggable={false}
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          />

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          />

          {/* Drag handle */}
          <div
            onPointerDown={handlePointerDown}
            className="absolute top-1/2 -translate-y-1/2 size-8 rounded-full bg-white shadow-md flex items-center justify-center cursor-col-resize z-10 hover:scale-110 transition-transform"
            style={{ left: `${sliderPosition}%`, transform: `translateX(-50%) translateY(-50%)` }}
            role="slider"
            aria-label="Comparison slider"
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuemin={5}
            aria-valuemax={95}
            tabIndex={0}
          >
            <GripVertical className="size-4 text-zinc-500" aria-hidden="true" />
          </div>

          {/* Labels */}
          <span className="absolute top-2 left-2 text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
            Before
          </span>
          <span className="absolute top-2 right-2 text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
            After
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            {status === 'idle' ? 'Connect before & after images' : 'Waiting for images...'}
          </p>
        </div>
      )}
    </BaseWorkflowNode>
  );
}

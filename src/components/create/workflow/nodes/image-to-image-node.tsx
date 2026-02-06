'use client';

import * as React from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';

export const imageToImageDefinition: WorkflowNodeDefinition = {
  type: 'imageToImage',
  label: 'Reference Image',
  category: 'input',
  description: 'Provide a reference image for image-to-image generation',
  icon: 'ImagePlus',
  inputs: [
    { id: 'image', label: 'Source', type: 'image' },
  ],
  outputs: [
    { id: 'image', label: 'Reference', type: 'image' },
  ],
  defaultConfig: { imageUrl: '', storagePath: '' },
  minWidth: 240,
};

export const imageToImageExecutor: NodeExecutor = async (inputs, config) => {
  // Prefer connected input over manually uploaded image
  const image = (inputs.image as string) || config.storagePath || config.imageUrl;
  if (!image) throw new Error('No reference image provided');
  return { image };
};

function dispatchConfig(nodeId: string, config: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('workflow-node-config', {
      detail: { nodeId, config },
    }),
  );
}

interface ImageToImageNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImageToImageNode({ data, id, selected }: ImageToImageNodeProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const config = data.config;
  const imageUrl = (config.imageUrl as string) || '';
  const hasConnectedInput = Boolean(data.outputValues?.image);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Convert to data URL for preview (actual upload happens during execution)
    const reader = new FileReader();
    reader.onload = () => {
      dispatchConfig(id, {
        ...config,
        imageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      dispatchConfig(id, {
        ...config,
        imageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatchConfig(id, { ...config, imageUrl: '', storagePath: '' });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imageToImageDefinition.label}
      icon={<ImagePlus className="size-4" />}
      inputs={imageToImageDefinition.inputs}
      outputs={imageToImageDefinition.outputs}
      minWidth={imageToImageDefinition.minWidth}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Reference"
            className="w-full h-32 object-cover"
            draggable={false}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Remove reference image"
          >
            <X className="size-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <Upload className="size-5 text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">
            Drop or click to upload
          </span>
        </div>
      )}

      {hasConnectedInput && (
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Using connected source image
        </p>
      )}
    </BaseWorkflowNode>
  );
}

'use client';

import * as React from 'react';
import { Eye, Download, Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const imagePreviewDefinition: WorkflowNodeDefinition = {
  type: 'imagePreview',
  label: 'Image Preview',
  category: 'output',
  description: 'Display and interact with a generated image',
  icon: 'Eye',
  inputs: [
    { id: 'image', label: 'Image', type: 'image', required: true },
  ],
  outputs: [],
  defaultConfig: {},
  minWidth: 260,
};

/** Preview is a terminal display node — no output */
export const imagePreviewExecutor: NodeExecutor = async (inputs) => {
  // Store the image in outputValues so the component can display it
  return { _displayImage: inputs.image };
};

interface ImagePreviewNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function ImagePreviewNode({ data, id, selected }: ImagePreviewNodeProps) {
  const status = data.status ?? 'idle';
  const imageUrl = data.outputValues?._displayImage as string | undefined;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-output-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success('Image URL copied');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={imagePreviewDefinition.label}
      icon={<Eye className="size-4" />}
      inputs={imagePreviewDefinition.inputs}
      outputs={imagePreviewDefinition.outputs}
      minWidth={imagePreviewDefinition.minWidth}
    >
      {status === 'success' && imageUrl ? (
        <div className="group/preview relative rounded-md overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Workflow output"
            className="w-full h-auto max-h-64 object-contain bg-muted/20"
            draggable={false}
          />
          {/* Hover actions — reuses the pattern from ImageNode */}
          <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDownload}
                    aria-label="Download image"
                    className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Download className="size-4 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyUrl}
                    aria-label="Copy image URL"
                    className="size-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Link2 className="size-4 text-zinc-900" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy URL</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-md border border-dashed border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            {status === 'idle' ? 'Run workflow to see output' : 'Waiting for image...'}
          </p>
        </div>
      )}
    </BaseWorkflowNode>
  );
}

'use client';

import * as React from 'react';
import { Palette, PersonStanding, FolderOpen, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';
import { useConnectedInputValue } from '../hooks/use-connected-input';
import {
  ImageUploadSlot,
  type UploadedImage,
} from '../shared/image-upload-slot';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SavedPose } from '@/utils/supabase/poses.server';

export const stylePoseRefDefinition: WorkflowNodeDefinition = {
  type: 'stylePoseRef',
  label: 'Style & Pose Reference',
  category: 'input',
  description: 'Provide an art style reference image and a pose reference image',
  icon: 'Palette',
  inputs: [
    { id: 'poseImage', label: 'Pose In', type: 'image' },
  ],
  outputs: [
    { id: 'style', label: 'Style', type: 'image' },
    { id: 'pose', label: 'Pose', type: 'image' },
  ],
  defaultConfig: { styleImages: [], poseImages: [] },
  minWidth: 260,
};

export const stylePoseRefExecutor: NodeExecutor = async (inputs, config) => {
  const connectedPose = inputs.poseImage as string | undefined;

  const styleImages = (config.styleImages as UploadedImage[]) ?? [];
  const poseImages = (config.poseImages as UploadedImage[]) ?? [];

  const stylePath = styleImages[0]?.storagePath;
  if (!stylePath) throw new Error('No art style reference image provided');

  let posePath: string | undefined;
  if (connectedPose) {
    posePath = connectedPose;
  } else {
    posePath = poseImages[0]?.storagePath;
  }
  if (!posePath) throw new Error('No pose reference image provided');

  return { style: stylePath, pose: posePath };
};

// ---------------------------------------------------------------------------
// Saved Poses Picker
// ---------------------------------------------------------------------------

interface SavedPosesPickerProps {
  onSelect: (pose: SavedPose) => void;
  onClose: () => void;
  selectedPath?: string;
}

function SavedPosesPicker({ onSelect, onClose, selectedPath }: SavedPosesPickerProps) {
  const [poses, setPoses] = React.useState<SavedPose[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadPoses = React.useCallback(async () => {
    setLoading(true);
    try {
      const { getSavedPoses } = await import('@/utils/supabase/poses.server');
      const data = await getSavedPoses();
      setPoses(data);
    } catch {
      toast.error('Failed to load saved poses');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPoses();
  }, [loadPoses]);

  // Listen for new poses being saved from Pose Creator
  React.useEffect(() => {
    const handler = () => loadPoses();
    window.addEventListener('pose-library-updated', handler);
    return () => window.removeEventListener('pose-library-updated', handler);
  }, [loadPoses]);

  const handleDelete = React.useCallback(async (e: React.MouseEvent, poseId: string) => {
    e.stopPropagation();
    try {
      const { deleteSavedPose } = await import('@/utils/supabase/poses.server');
      const ok = await deleteSavedPose(poseId);
      if (!ok) throw new Error('Delete failed');
      setPoses((prev) => prev.filter((p) => p.id !== poseId));
      toast.success('Pose deleted');
    } catch {
      toast.error('Failed to delete pose');
    }
  }, []);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-b border-border">
        <span className="text-[10px] font-medium">Saved Poses</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="Close saved poses"
        >
          <X className="size-3" />
        </button>
      </div>
      <ScrollArea className="nodrag nowheel h-36">
        {loading ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">Loading...</p>
        ) : poses.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">
            No saved poses yet. Create one with the Pose Creator node.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {poses.map((pose) => {
              const isSelected = selectedPath === pose.image_path;
              return (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => onSelect(pose)}
                  className={`relative group/pose aspect-[3/4] rounded-sm overflow-hidden border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border hover:ring-1 hover:ring-primary/50'
                  }`}
                  title={pose.name}
                >
                  <img
                    src={pose.image_url}
                    alt={pose.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                      <span className="text-[8px] text-primary font-bold">Selected</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, pose.id)}
                    className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/pose:opacity-100 hover:bg-destructive/80 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label={`Delete ${pose.name}`}
                  >
                    <Trash2 className="size-2.5 text-white" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                    <span className="text-[8px] text-white truncate block">{pose.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node component
// ---------------------------------------------------------------------------

interface StylePoseRefNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function StylePoseRefNode({ data, id, selected }: StylePoseRefNodeProps) {
  const [config, , updateMultiple] = useNodeConfig(id, data.config);
  const connectedPose = useConnectedInputValue(id, 'poseImage');
  const [showPoseLibrary, setShowPoseLibrary] = React.useState(false);

  const styleImages: UploadedImage[] = React.useMemo(
    () => (config.styleImages as UploadedImage[] | undefined) ?? [],
    [config.styleImages],
  );

  const poseImages: UploadedImage[] = React.useMemo(
    () => (config.poseImages as UploadedImage[] | undefined) ?? [],
    [config.poseImages],
  );

  const handleStyleChange = React.useCallback(
    (imgs: UploadedImage[]) => updateMultiple({ styleImages: imgs }),
    [updateMultiple],
  );

  const handlePoseChange = React.useCallback(
    (imgs: UploadedImage[]) => updateMultiple({ poseImages: imgs }),
    [updateMultiple],
  );

  const handleSelectSavedPose = React.useCallback(
    (pose: SavedPose) => {
      updateMultiple({
        poseImages: [{ url: pose.image_url, storagePath: pose.image_path }],
      });
      setShowPoseLibrary(false);
    },
    [updateMultiple],
  );

  const hasPoseConnection = connectedPose !== undefined;
  const currentPosePath = poseImages[0]?.storagePath;

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={stylePoseRefDefinition.label}
      icon={<Palette className="size-4" />}
      inputs={stylePoseRefDefinition.inputs}
      outputs={stylePoseRefDefinition.outputs}
      minWidth={stylePoseRefDefinition.minWidth}
    >
      <div className="space-y-3">
        {/* Art Style Reference */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Palette className="size-3 text-violet-400" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Art Style
            </span>
          </div>
          <ImageUploadSlot
            images={styleImages}
            onChange={handleStyleChange}
            maxImages={1}
            emptyLabel="Drop style reference"
            previewHeight="h-auto"
            objectFit="contain"
          />
        </div>

        {/* Pose Reference */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <PersonStanding className="size-3 text-blue-400" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Pose
            </span>
          </div>

          {hasPoseConnection ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-blue-500/40 bg-blue-500/5 h-20">
              <PersonStanding className="size-4 text-blue-400 mb-1" />
              <span className="text-[10px] text-blue-400">
                Connected from Pose Creator
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <ImageUploadSlot
                images={poseImages}
                onChange={handlePoseChange}
                maxImages={1}
                showLibraryPicker={false}
                emptyLabel="Drop pose reference"
                previewHeight="h-auto"
                objectFit="contain"
              />
              {/* Saved Poses button */}
              <button
                type="button"
                onClick={() => setShowPoseLibrary(!showPoseLibrary)}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Pick from saved poses"
              >
                <FolderOpen className="size-3" />
                Saved Poses
              </button>
              {showPoseLibrary && (
                <SavedPosesPicker
                  onSelect={handleSelectSavedPose}
                  onClose={() => setShowPoseLibrary(false)}
                  selectedPath={currentPosePath}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </BaseWorkflowNode>
  );
}

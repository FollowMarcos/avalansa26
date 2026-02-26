'use client';

import * as React from 'react';
import { PersonStanding, RotateCcw, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';

// ---------------------------------------------------------------------------
// Joint / Limb definitions (exported for reuse by style-pose-ref-node)
// ---------------------------------------------------------------------------

export interface Joint {
  id: string;
  x: number;
  y: number;
}

interface Limb {
  from: string;
  to: string;
}

export const LIMBS: Limb[] = [
  { from: 'head', to: 'neck' },
  { from: 'neck', to: 'leftShoulder' },
  { from: 'neck', to: 'rightShoulder' },
  { from: 'leftShoulder', to: 'leftElbow' },
  { from: 'leftElbow', to: 'leftWrist' },
  { from: 'rightShoulder', to: 'rightElbow' },
  { from: 'rightElbow', to: 'rightWrist' },
  { from: 'neck', to: 'torso' },
  { from: 'torso', to: 'leftHip' },
  { from: 'torso', to: 'rightHip' },
  { from: 'leftHip', to: 'leftKnee' },
  { from: 'leftKnee', to: 'leftAnkle' },
  { from: 'rightHip', to: 'rightKnee' },
  { from: 'rightKnee', to: 'rightAnkle' },
];

export const DEFAULT_JOINTS: Joint[] = [
  { id: 'head', x: 0.5, y: 0.08 },
  { id: 'neck', x: 0.5, y: 0.18 },
  { id: 'leftShoulder', x: 0.35, y: 0.22 },
  { id: 'rightShoulder', x: 0.65, y: 0.22 },
  { id: 'leftElbow', x: 0.28, y: 0.38 },
  { id: 'rightElbow', x: 0.72, y: 0.38 },
  { id: 'leftWrist', x: 0.22, y: 0.52 },
  { id: 'rightWrist', x: 0.78, y: 0.52 },
  { id: 'torso', x: 0.5, y: 0.45 },
  { id: 'leftHip', x: 0.4, y: 0.55 },
  { id: 'rightHip', x: 0.6, y: 0.55 },
  { id: 'leftKnee', x: 0.38, y: 0.72 },
  { id: 'rightKnee', x: 0.62, y: 0.72 },
  { id: 'leftAnkle', x: 0.36, y: 0.9 },
  { id: 'rightAnkle', x: 0.64, y: 0.9 },
];

const HEAD_RADIUS_RATIO = 0.06;
const JOINT_RADIUS = 5;
const LIMB_WIDTH = 3;

// ---------------------------------------------------------------------------
// Node definition
// ---------------------------------------------------------------------------

export const poseCreatorDefinition: WorkflowNodeDefinition = {
  type: 'poseCreator',
  label: 'Pose Creator',
  category: 'input',
  description: 'Create a stick-figure pose by dragging joints, then save to your library',
  icon: 'PersonStanding',
  inputs: [],
  outputs: [
    { id: 'pose', label: 'Pose', type: 'image' },
  ],
  defaultConfig: { joints: DEFAULT_JOINTS },
  minWidth: 260,
};

// ---------------------------------------------------------------------------
// Render helper (shared between executor and save)
// ---------------------------------------------------------------------------

export function renderPoseToDataUrl(joints: Joint[], width = 512, height = 512): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const jointMap = new Map(joints.map((j) => [j.id, j]));

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const limb of LIMBS) {
    const from = jointMap.get(limb.from);
    const to = jointMap.get(limb.to);
    if (!from || !to) continue;
    ctx.beginPath();
    ctx.moveTo(from.x * width, from.y * height);
    ctx.lineTo(to.x * width, to.y * height);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  for (const joint of joints) {
    if (joint.id === 'head') {
      ctx.beginPath();
      ctx.arc(joint.x * width, joint.y * height, HEAD_RADIUS_RATIO * width, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(joint.x * width, joint.y * height, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Executor — renders pose, uploads to Cloudflare R2
// ---------------------------------------------------------------------------

export const poseCreatorExecutor: NodeExecutor = async (_inputs, config) => {
  const joints = (config.joints as Joint[]) ?? DEFAULT_JOINTS;
  const dataUrl = renderPoseToDataUrl(joints);

  const { createClient } = await import('@/utils/supabase/client');
  const { uploadReferenceImage } = await import('@/utils/supabase/storage');
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], `pose-${Date.now()}.png`, { type: 'image/png' });

  const result = await uploadReferenceImage(file, userData.user.id);
  if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

  return { pose: result.path };
};

// ---------------------------------------------------------------------------
// Interactive pose canvas component
// ---------------------------------------------------------------------------

interface PoseCanvasProps {
  joints: Joint[];
  onChange: (joints: Joint[]) => void;
  width: number;
  height: number;
}

function PoseCanvas({ joints, onChange, width, height }: PoseCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const jointMap = React.useMemo(
    () => new Map(joints.map((j) => [j.id, j])),
    [joints],
  );

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Limbs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = LIMB_WIDTH;
    ctx.lineCap = 'round';
    for (const limb of LIMBS) {
      const from = jointMap.get(limb.from);
      const to = jointMap.get(limb.to);
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x * width, from.y * height);
      ctx.lineTo(to.x * width, to.y * height);
      ctx.stroke();
    }

    // Joints
    for (const joint of joints) {
      const px = joint.x * width;
      const py = joint.y * height;
      const isActive = dragging === joint.id;

      if (joint.id === 'head') {
        ctx.beginPath();
        ctx.arc(px, py, HEAD_RADIUS_RATIO * width, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, JOINT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#3b82f6' : '#ffffff';
        ctx.fill();
        if (isActive) {
          ctx.beginPath();
          ctx.arc(px, py, JOINT_RADIUS + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = LIMB_WIDTH;
  }, [joints, jointMap, width, height, dragging]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  const findJointAt = React.useCallback(
    (nx: number, ny: number): string | null => {
      const threshold = 0.05;
      let closest: string | null = null;
      let minDist = threshold;
      for (const joint of joints) {
        const dx = joint.x - nx;
        const dy = joint.y - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = joint.id;
        }
      }
      return closest;
    },
    [joints],
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const jointId = findJointAt(nx, ny);
      if (jointId) {
        setDragging(jointId);
        canvas.setPointerCapture(e.pointerId);
      }
    },
    [findJointAt],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragging) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const updated = joints.map((j) =>
        j.id === dragging ? { ...j, x: nx, y: ny } : j,
      );
      onChange(updated);
    },
    [dragging, joints, onChange],
  );

  const handlePointerUp = React.useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="nodrag nowheel w-full rounded-md border border-border cursor-crosshair"
      style={{ aspectRatio: `${width}/${height}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

// ---------------------------------------------------------------------------
// Node component
// ---------------------------------------------------------------------------

interface PoseCreatorNodeProps {
  data: WorkflowNodeData;
  id: string;
  selected?: boolean;
}

export function PoseCreatorNode({ data, id, selected }: PoseCreatorNodeProps) {
  const [config, update] = useNodeConfig(id, data.config);
  const [saving, setSaving] = React.useState(false);

  const joints: Joint[] = React.useMemo(
    () => (config.joints as Joint[] | undefined) ?? DEFAULT_JOINTS,
    [config.joints],
  );

  const handleJointsChange = React.useCallback(
    (newJoints: Joint[]) => update('joints', newJoints),
    [update],
  );

  const handleReset = React.useCallback(
    () => update('joints', DEFAULT_JOINTS),
    [update],
  );

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = renderPoseToDataUrl(joints);

      // Upload to Cloudflare R2
      const { createClient } = await import('@/utils/supabase/client');
      const { uploadReferenceImage } = await import('@/utils/supabase/storage');
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `pose-${Date.now()}.png`, { type: 'image/png' });

      const result = await uploadReferenceImage(file, userData.user.id);
      if (result.error || !result.path) throw new Error(result.error || 'Upload failed');

      // Save to database
      const { savePose } = await import('@/utils/supabase/poses.server');
      const name = `Pose ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      const saved = await savePose({
        name,
        joints,
        image_path: result.path,
        image_url: result.url,
      });

      if (!saved) throw new Error('Failed to save pose');

      // Notify other nodes that a new pose was saved
      window.dispatchEvent(new CustomEvent('pose-library-updated'));
      toast.success('Pose saved to library');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save pose');
    } finally {
      setSaving(false);
    }
  }, [joints]);

  return (
    <BaseWorkflowNode
      id={id}
      data={data}
      selected={selected}
      label={poseCreatorDefinition.label}
      icon={<PersonStanding className="size-4" />}
      inputs={poseCreatorDefinition.inputs}
      outputs={poseCreatorDefinition.outputs}
      minWidth={poseCreatorDefinition.minWidth}
    >
      <div className="space-y-1.5">
        <PoseCanvas
          joints={joints}
          onChange={handleJointsChange}
          width={240}
          height={320}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Drag joints to pose
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1.5 py-0.5 border border-border hover:bg-muted/40 disabled:opacity-50"
              aria-label="Save pose to library"
            >
              {saving ? (
                <Loader2 className="size-3 motion-safe:animate-spin" />
              ) : (
                <Save className="size-3" />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
              aria-label="Reset pose to default"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </BaseWorkflowNode>
  );
}

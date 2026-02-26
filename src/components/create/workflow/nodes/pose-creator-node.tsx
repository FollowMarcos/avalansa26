'use client';

import * as React from 'react';
import { PersonStanding, RotateCcw, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Canvas, useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { BaseWorkflowNode } from '../base-workflow-node';
import type { WorkflowNodeData, WorkflowNodeDefinition } from '@/types/workflow';
import type { NodeExecutor } from '../node-registry';
import { useNodeConfig } from '../hooks/use-node-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Joint3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

/** Legacy 2D joint (backward compat) */
export interface Joint {
  id: string;
  x: number;
  y: number;
}

export interface CameraState {
  azimuth: number;
  elevation: number;
  distance: number;
}

interface Limb {
  from: string;
  to: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

export const DEFAULT_JOINTS_3D: Joint3D[] = [
  { id: 'head', x: 0, y: 1.65, z: 0 },
  { id: 'neck', x: 0, y: 1.50, z: 0 },
  { id: 'leftShoulder', x: -0.2, y: 1.45, z: 0 },
  { id: 'rightShoulder', x: 0.2, y: 1.45, z: 0 },
  { id: 'leftElbow', x: -0.5, y: 1.45, z: 0 },
  { id: 'rightElbow', x: 0.5, y: 1.45, z: 0 },
  { id: 'leftWrist', x: -0.8, y: 1.45, z: 0 },
  { id: 'rightWrist', x: 0.8, y: 1.45, z: 0 },
  { id: 'torso', x: 0, y: 1.10, z: 0 },
  { id: 'leftHip', x: -0.12, y: 0.90, z: 0 },
  { id: 'rightHip', x: 0.12, y: 0.90, z: 0 },
  { id: 'leftKnee', x: -0.12, y: 0.50, z: 0 },
  { id: 'rightKnee', x: 0.12, y: 0.50, z: 0 },
  { id: 'leftAnkle', x: -0.12, y: 0.05, z: 0 },
  { id: 'rightAnkle', x: 0.12, y: 0.05, z: 0 },
];

/** Legacy 2D defaults (kept for backward compat export) */
export const DEFAULT_JOINTS: Joint[] = DEFAULT_JOINTS_3D.map(({ id, x, y }) => ({ id, x, y }));

const DEFAULT_CAMERA: CameraState = { azimuth: 30, elevation: 20, distance: 3 };
const FIGURE_CENTER = new THREE.Vector3(0, 0.85, 0);
const JOINT_RADIUS = 0.04;
const HEAD_RADIUS = 0.08;
const LIMB_RADIUS = 0.02;

// ---------------------------------------------------------------------------
// Backward compatibility: normalize 2D or 3D joints
// ---------------------------------------------------------------------------

function normalizeJoints(raw: unknown): Joint3D[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_JOINTS_3D;
  const first = raw[0] as Record<string, unknown>;
  if (typeof first.z === 'number') return raw as Joint3D[];
  // Convert 2D normalized coords to 3D world space
  return raw.map((j: Record<string, unknown>) => ({
    id: j.id as string,
    x: ((j.x as number) - 0.5) * 1.6,
    y: (1 - (j.y as number)) * 1.7,
    z: 0,
  }));
}

// ---------------------------------------------------------------------------
// Node definition
// ---------------------------------------------------------------------------

export const poseCreatorDefinition: WorkflowNodeDefinition = {
  type: 'poseCreator',
  label: 'Pose Creator',
  category: 'input',
  description: 'Create a 3D stick-figure pose by dragging joints, orbit to set the camera angle',
  icon: 'PersonStanding',
  inputs: [],
  outputs: [
    { id: 'pose', label: 'Pose', type: 'image' },
  ],
  defaultConfig: {
    joints: DEFAULT_JOINTS_3D,
    cameraState: DEFAULT_CAMERA,
  },
  minWidth: 280,
};

// ---------------------------------------------------------------------------
// Offscreen 3D renderer (for executor + save — no React dependency)
// ---------------------------------------------------------------------------

export function render3DPoseToDataUrl(
  joints: Joint3D[],
  cameraState: CameraState,
  width = 512,
  height = 512,
): string {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const jointMap = new Map(joints.map((j) => [j.id, j]));
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  // Joints
  for (const joint of joints) {
    const r = joint.id === 'head' ? HEAD_RADIUS : JOINT_RADIUS;
    const geo = new THREE.SphereGeometry(r, 16, 16);
    const mesh = new THREE.Mesh(geo, whiteMat);
    mesh.position.set(joint.x, joint.y, joint.z);
    scene.add(mesh);
  }

  // Limbs
  for (const limb of LIMBS) {
    const from = jointMap.get(limb.from);
    const to = jointMap.get(limb.to);
    if (!from || !to) continue;

    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);
    const length = start.distanceTo(end);
    if (length < 0.001) continue;

    const geo = new THREE.CylinderGeometry(LIMB_RADIUS, LIMB_RADIUS, length, 8);
    const mesh = new THREE.Mesh(geo, whiteMat);
    mesh.position.addVectors(start, end).multiplyScalar(0.5);

    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    scene.add(mesh);
  }

  // Camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
  const azRad = THREE.MathUtils.degToRad(cameraState.azimuth);
  const elRad = THREE.MathUtils.degToRad(cameraState.elevation);
  const d = cameraState.distance;
  camera.position.set(
    d * Math.sin(azRad) * Math.cos(elRad),
    d * Math.sin(elRad) + FIGURE_CENTER.y,
    d * Math.cos(azRad) * Math.cos(elRad),
  );
  camera.lookAt(FIGURE_CENTER);

  // Render
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');

  // Cleanup
  renderer.dispose();
  whiteMat.dispose();
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
    }
  });

  return dataUrl;
}

/** Legacy 2D render (kept for backward compat) */
export function renderPoseToDataUrl(joints: Joint[], width = 512, height = 512): string {
  const joints3d = normalizeJoints(joints);
  return render3DPoseToDataUrl(joints3d, DEFAULT_CAMERA, width, height);
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const poseCreatorExecutor: NodeExecutor = async (_inputs, config) => {
  const joints = normalizeJoints(config.joints);
  const cameraState = (config.cameraState as CameraState) ?? DEFAULT_CAMERA;
  const dataUrl = render3DPoseToDataUrl(joints, cameraState);

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
// 3D Scene: Joint Sphere
// ---------------------------------------------------------------------------

interface JointSphereProps {
  joint: Joint3D;
  isActive: boolean;
  onDragStart: (jointId: string, position: THREE.Vector3) => void;
  onHover: (jointId: string | null) => void;
}

function JointSphere({ joint, isActive, onDragStart, onHover }: JointSphereProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const isHead = joint.id === 'head';
  const r = isHead ? HEAD_RADIUS : JOINT_RADIUS;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(joint.x, joint.y, joint.z);
    const s = isActive ? 1.4 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.3);
  });

  return (
    <mesh
      ref={meshRef}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onDragStart(joint.id, new THREE.Vector3(joint.x, joint.y, joint.z));
      }}
      onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(joint.id);
      }}
      onPointerLeave={() => onHover(null)}
    >
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial
        color={isActive ? '#3b82f6' : '#ffffff'}
        emissive={isActive ? '#3b82f6' : '#000000'}
        emissiveIntensity={isActive ? 0.6 : 0}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// 3D Scene: Limb Cylinder
// ---------------------------------------------------------------------------

function LimbCylinder({ from, to }: { from: Joint3D; to: Joint3D }) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);
    const length = start.distanceTo(end);
    if (length < 0.001) return;

    meshRef.current.position.addVectors(start, end).multiplyScalar(0.5);
    meshRef.current.scale.set(1, length, 1);

    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    meshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[LIMB_RADIUS, LIMB_RADIUS, 1, 8]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// 3D Scene: Main scene component
// ---------------------------------------------------------------------------

interface PoseSceneProps {
  joints: Joint3D[];
  onJointsChange: (joints: Joint3D[]) => void;
  onCameraChange: (state: CameraState) => void;
}

function PoseScene({ joints, onJointsChange, onCameraChange }: PoseSceneProps) {
  const { camera, gl, raycaster } = useThree();
  const orbitRef = React.useRef<import('@react-three/drei').OrbitControlsChangeEvent>(null);
  const [draggingJoint, setDraggingJoint] = React.useState<string | null>(null);
  const [hoveredJoint, setHoveredJoint] = React.useState<string | null>(null);
  const dragPlane = React.useRef(new THREE.Plane());
  const intersection = React.useRef(new THREE.Vector3());

  const jointMap = React.useMemo(
    () => new Map(joints.map((j) => [j.id, j])),
    [joints],
  );

  // Joint drag start
  const handleDragStart = React.useCallback(
    (jointId: string, position: THREE.Vector3) => {
      setDraggingJoint(jointId);
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      dragPlane.current.setFromNormalAndCoplanarPoint(cameraDir, position);
    },
    [camera],
  );

  // Pointer move/up on gl.domElement (same pattern as camera-angle-viewport.tsx)
  React.useEffect(() => {
    if (!draggingJoint) return;
    const canvas = gl.domElement;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);

      if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
        const pt = intersection.current;
        // Clamp to reasonable bounds
        const cx = THREE.MathUtils.clamp(pt.x, -2, 2);
        const cy = THREE.MathUtils.clamp(pt.y, -0.5, 3);
        const cz = THREE.MathUtils.clamp(pt.z, -2, 2);

        onJointsChange(
          joints.map((j) =>
            j.id === draggingJoint ? { ...j, x: cx, y: cy, z: cz } : j,
          ),
        );
      }
    };

    const onPointerUp = () => {
      setDraggingJoint(null);
      canvas.style.cursor = 'default';
    };

    canvas.style.cursor = 'grabbing';
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    };
  }, [draggingJoint, joints, camera, gl, raycaster, onJointsChange]);

  // Cursor for hover
  React.useEffect(() => {
    if (!draggingJoint && hoveredJoint) {
      gl.domElement.style.cursor = 'grab';
    } else if (!draggingJoint) {
      gl.domElement.style.cursor = 'default';
    }
  }, [hoveredJoint, draggingJoint, gl]);

  // Sync orbit camera state on orbit end
  const handleOrbitEnd = React.useCallback(() => {
    const spherical = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(camera.position, FIGURE_CENTER),
    );
    onCameraChange({
      azimuth: THREE.MathUtils.radToDeg(spherical.theta),
      elevation: THREE.MathUtils.radToDeg(Math.PI / 2 - spherical.phi),
      distance: spherical.radius,
    });
  }, [camera, onCameraChange]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />

      <OrbitControls
        ref={orbitRef as React.Ref<never>}
        target={[FIGURE_CENTER.x, FIGURE_CENTER.y, FIGURE_CENTER.z]}
        enableRotate={!draggingJoint}
        enablePan={!draggingJoint}
        enableZoom={!draggingJoint}
        minDistance={2}
        maxDistance={10}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI * 0.85}
        onEnd={handleOrbitEnd}
      />

      {/* Joint spheres */}
      {joints.map((joint) => (
        <JointSphere
          key={joint.id}
          joint={joint}
          isActive={draggingJoint === joint.id || hoveredJoint === joint.id}
          onDragStart={handleDragStart}
          onHover={setHoveredJoint}
        />
      ))}

      {/* Limb cylinders */}
      {LIMBS.map((limb) => {
        const from = jointMap.get(limb.from);
        const to = jointMap.get(limb.to);
        if (!from || !to) return null;
        return <LimbCylinder key={`${limb.from}-${limb.to}`} from={from} to={to} />;
      })}

      {/* Ground grid */}
      <Grid
        args={[10, 10]}
        position={[0, -0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1e1e2e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a2a3e"
        fadeDistance={6}
        fadeStrength={1}
        infiniteGrid
      />
    </>
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
  const [config, update, updateMultiple] = useNodeConfig(id, data.config);
  const [saving, setSaving] = React.useState(false);

  const joints = React.useMemo(
    () => normalizeJoints(config.joints),
    [config.joints],
  );

  const cameraState: CameraState = React.useMemo(
    () => (config.cameraState as CameraState | undefined) ?? DEFAULT_CAMERA,
    [config.cameraState],
  );

  const handleJointsChange = React.useCallback(
    (newJoints: Joint3D[]) => update('joints', newJoints),
    [update],
  );

  const handleCameraChange = React.useCallback(
    (state: CameraState) => update('cameraState', state),
    [update],
  );

  const handleReset = React.useCallback(
    () => updateMultiple({ joints: DEFAULT_JOINTS_3D, cameraState: DEFAULT_CAMERA }),
    [updateMultiple],
  );

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = render3DPoseToDataUrl(joints, cameraState);

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

      const { savePose } = await import('@/utils/supabase/poses.server');
      const name = `Pose ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      const saved = await savePose({
        name,
        joints,
        image_path: result.path,
        image_url: result.url,
      });

      if (!saved) throw new Error('Failed to save pose');

      window.dispatchEvent(new CustomEvent('pose-library-updated'));
      toast.success('Pose saved to library');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save pose');
    } finally {
      setSaving(false);
    }
  }, [joints, cameraState]);

  // Compute initial camera position from state
  const initialCameraPos = React.useMemo(() => {
    const az = THREE.MathUtils.degToRad(cameraState.azimuth);
    const el = THREE.MathUtils.degToRad(cameraState.elevation);
    const d = cameraState.distance;
    return [
      d * Math.sin(az) * Math.cos(el),
      d * Math.sin(el) + FIGURE_CENTER.y,
      d * Math.cos(az) * Math.cos(el),
    ] as [number, number, number];
  }, []); // Only compute once on mount

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
      resizable
      minHeight={420}
    >
      {/* 3D Viewport — flex-1 fills all available node height */}
      <div
        className="nodrag nowheel flex-1 min-h-0 rounded-md overflow-hidden border border-border/50"
        style={{ touchAction: 'manipulation' }}
      >
        <Canvas
          camera={{ position: initialCameraPos, fov: 50, near: 0.1, far: 50 }}
          style={{ background: '#0a0a0a' }}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        >
          <PoseScene
            joints={joints}
            onJointsChange={handleJointsChange}
            onCameraChange={handleCameraChange}
          />
        </Canvas>
      </div>

      {/* Angle readout */}
      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-muted-foreground px-0.5 pt-1.5">
        <span>Az: {cameraState.azimuth.toFixed(0)}&deg;</span>
        <span>El: {cameraState.elevation.toFixed(0)}&deg;</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10px] text-muted-foreground">
          Orbit + drag joints
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
    </BaseWorkflowNode>
  );
}

'use client';

import * as React from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { Grid, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Subject center in the scene */
const CENTER = new THREE.Vector3(0, 0.75, 0);

/** Radius of the azimuth ring on the ground */
const AZIMUTH_RADIUS = 2.0;

/** Radius of the elevation arc */
const ELEVATION_RADIUS = 1.6;

/** Base distance from center for the camera model */
const BASE_DISTANCE = 1.6;

/** Handle sphere size */
const HANDLE_RADIUS = 0.14;

/** Snap positions the LoRA was trained on */
const AZIMUTH_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315];
const ELEVATION_SNAPS = [-30, 0, 30, 60];

const AZIMUTH_NAMES: Record<number, string> = {
  0: 'front view', 45: 'front-right', 90: 'right side',
  135: 'back-right', 180: 'back view', 225: 'back-left',
  270: 'left side', 315: 'front-left',
};
const ELEVATION_NAMES: Record<number, string> = {
  '-30': 'low angle', '0': 'eye level', '30': 'elevated', '60': 'high angle',
};

export function snapToNearest(value: number, snaps: number[]): number {
  return snaps.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

/** Build the prompt the LoRA expects from current angles. */
export function buildCameraPrompt(azimuth: number, elevation: number): string {
  const azSnap = snapToNearest(azimuth, AZIMUTH_SNAPS);
  const elSnap = snapToNearest(elevation, ELEVATION_SNAPS);
  return `${AZIMUTH_NAMES[azSnap]}, ${ELEVATION_NAMES[String(elSnap) as unknown as number]}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CameraAngleViewportProps {
  horizontalAngle: number; // 0-360 degrees
  verticalAngle: number; // -30 to 60 degrees
  zoom: number; // 0-10
  onAngleChange: (horizontal: number, vertical: number) => void;
  onZoomChange: (zoom: number) => void;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const COLORS = {
  azimuth: '#22c55e',    // green
  elevation: '#ec4899',  // pink
  camera: '#60a5fa',     // blue
  line: '#60a5fa',       // blue (camera to center line)
};

// ---------------------------------------------------------------------------
// Camera model (box + lens cylinder)
// ---------------------------------------------------------------------------

function CameraModel({
  horizontalAngle,
  verticalAngle,
}: {
  horizontalAngle: number;
  verticalAngle: number;
}) {
  const groupRef = React.useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const azRad = THREE.MathUtils.degToRad(horizontalAngle);
    const elRad = THREE.MathUtils.degToRad(verticalAngle);
    const distance = BASE_DISTANCE;

    const x = distance * Math.sin(azRad) * Math.cos(elRad);
    const y = distance * Math.sin(elRad) + CENTER.y;
    const z = distance * Math.cos(azRad) * Math.cos(elRad);

    groupRef.current.position.set(x, y, z);
    groupRef.current.lookAt(CENTER);
  });

  return (
    <group ref={groupRef}>
      {/* Camera body */}
      <mesh>
        <boxGeometry args={[0.24, 0.18, 0.3]} />
        <meshStandardMaterial color={COLORS.camera} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Lens */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 12]} />
        <meshStandardMaterial color={COLORS.camera} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Line from camera to center
// ---------------------------------------------------------------------------

function CameraLine({
  horizontalAngle,
  verticalAngle,
}: {
  horizontalAngle: number;
  verticalAngle: number;
}) {
  const lineRef = React.useRef<THREE.Line>(null);

  useFrame(() => {
    if (!lineRef.current) return;

    const azRad = THREE.MathUtils.degToRad(horizontalAngle);
    const elRad = THREE.MathUtils.degToRad(verticalAngle);

    const x = BASE_DISTANCE * Math.sin(azRad) * Math.cos(elRad);
    const y = BASE_DISTANCE * Math.sin(elRad) + CENTER.y;
    const z = BASE_DISTANCE * Math.cos(azRad) * Math.cos(elRad);

    const positions = lineRef.current.geometry.attributes.position;
    if (positions) {
      positions.setXYZ(0, CENTER.x, CENTER.y, CENTER.z);
      positions.setXYZ(1, x, y, z);
      positions.needsUpdate = true;
    }
  });

  const lineObj = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.line,
      opacity: 0.4,
      transparent: true,
    });
    return new THREE.Line(geo, mat);
  }, []);

  lineRef.current = lineObj;

  return <primitive object={lineObj} />;
}

// ---------------------------------------------------------------------------
// Azimuth ring (green torus on the ground)
// ---------------------------------------------------------------------------

function AzimuthRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <torusGeometry args={[AZIMUTH_RADIUS, 0.025, 8, 64]} />
      <meshStandardMaterial
        color={COLORS.azimuth}
        emissive={COLORS.azimuth}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Elevation arc (pink tube)
// ---------------------------------------------------------------------------

function ElevationArc() {
  const tubeObj = React.useMemo(() => {
    const arcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = THREE.MathUtils.degToRad(-30 + (90 * i) / 32);
      arcPoints.push(
        new THREE.Vector3(
          0,
          ELEVATION_RADIUS * Math.sin(angle) + CENTER.y,
          ELEVATION_RADIUS * Math.cos(angle),
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(arcPoints);
    const geo = new THREE.TubeGeometry(curve, 32, 0.025, 8, false);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.elevation,
      emissive: COLORS.elevation,
      emissiveIntensity: 0.3,
    });
    return new THREE.Mesh(geo, mat);
  }, []);

  return <primitive object={tubeObj} />;
}

// ---------------------------------------------------------------------------
// Draggable handle (sphere)
// ---------------------------------------------------------------------------

interface HandleProps {
  color: string;
  position: [number, number, number];
  onDragStart: () => void;
  onHover: (hovered: boolean) => void;
  isActive: boolean;
}

function Handle({ color, position, onDragStart, onHover, isActive }: HandleProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...position);
    const targetScale = isActive ? 1.3 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.3,
    );
  });

  return (
    <mesh
      ref={meshRef}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onDragStart();
      }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <sphereGeometry args={[HANDLE_RADIUS, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 0.8 : 0.4}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene — handles dragging and syncs props
// ---------------------------------------------------------------------------

function Scene({
  horizontalAngle,
  verticalAngle,
  onAngleChange,
  imageUrl,
}: {
  horizontalAngle: number;
  verticalAngle: number;
  onAngleChange: (h: number, v: number) => void;
  imageUrl?: string;
}) {
  const { camera, gl, raycaster } = useThree();
  const [dragTarget, setDragTarget] = React.useState<'azimuth' | 'elevation' | null>(null);
  const [hoveredHandle, setHoveredHandle] = React.useState<'azimuth' | 'elevation' | null>(null);
  const intersection = React.useMemo(() => new THREE.Vector3(), []);

  // Compute handle positions
  const azRad = THREE.MathUtils.degToRad(horizontalAngle);
  const elRad = THREE.MathUtils.degToRad(verticalAngle);

  const azimuthHandlePos: [number, number, number] = [
    AZIMUTH_RADIUS * Math.sin(azRad),
    0.05,
    AZIMUTH_RADIUS * Math.cos(azRad),
  ];

  const elevationHandlePos: [number, number, number] = [
    0,
    ELEVATION_RADIUS * Math.sin(elRad) + CENTER.y,
    ELEVATION_RADIUS * Math.cos(elRad),
  ];

  // Handle pointer move for dragging
  React.useEffect(() => {
    if (!dragTarget) return;

    const canvas = gl.domElement;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      if (dragTarget === 'azimuth') {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          let angle = THREE.MathUtils.radToDeg(
            Math.atan2(intersection.x, intersection.z),
          );
          if (angle < 0) angle += 360;
          onAngleChange(Math.round(angle * 10) / 10, verticalAngle);
        }
      } else if (dragTarget === 'elevation') {
        const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          const relY = intersection.y - CENTER.y;
          const relZ = intersection.z;
          const angle = THREE.MathUtils.clamp(
            THREE.MathUtils.radToDeg(Math.atan2(relY, relZ)),
            -30,
            60,
          );
          onAngleChange(horizontalAngle, Math.round(angle * 10) / 10);
        }
      }
    };

    const onPointerUp = () => {
      // Snap to nearest valid position on release
      const azSnap = snapToNearest(horizontalAngle, AZIMUTH_SNAPS);
      const elSnap = snapToNearest(verticalAngle, ELEVATION_SNAPS);
      onAngleChange(azSnap, elSnap);
      setDragTarget(null);
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
  }, [dragTarget, horizontalAngle, verticalAngle, camera, gl, raycaster, onAngleChange, intersection]);

  // Cursor style
  React.useEffect(() => {
    if (!dragTarget && hoveredHandle) {
      gl.domElement.style.cursor = 'grab';
    } else if (!dragTarget) {
      gl.domElement.style.cursor = 'default';
    }
  }, [hoveredHandle, dragTarget, gl]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />

      {/* Subject (image or placeholder sphere) */}
      <React.Suspense fallback={<SubjectSphere />}>
        {imageUrl ? <SubjectImagePlane url={imageUrl} /> : <SubjectSphere />}
      </React.Suspense>

      {/* Camera model */}
      <CameraModel horizontalAngle={horizontalAngle} verticalAngle={verticalAngle} />
      <CameraLine horizontalAngle={horizontalAngle} verticalAngle={verticalAngle} />

      {/* Azimuth ring + handle (green) */}
      <AzimuthRing />
      <Handle
        color={COLORS.azimuth}
        position={azimuthHandlePos}
        onDragStart={() => setDragTarget('azimuth')}
        onHover={(h) => setHoveredHandle(h ? 'azimuth' : null)}
        isActive={dragTarget === 'azimuth' || hoveredHandle === 'azimuth'}
      />

      {/* Elevation arc + handle (pink) */}
      <ElevationArc />
      <Handle
        color={COLORS.elevation}
        position={elevationHandlePos}
        onDragStart={() => setDragTarget('elevation')}
        onHover={(h) => setHoveredHandle(h ? 'elevation' : null)}
        isActive={dragTarget === 'elevation' || hoveredHandle === 'elevation'}
      />

      {/* Grid */}
      <Grid
        args={[10, 10]}
        position={[0, -0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1e1e2e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a2a3e"
        fadeDistance={8}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Subject sphere (placeholder when no image connected)
// ---------------------------------------------------------------------------

function SubjectSphere() {
  return (
    <mesh position={[CENTER.x, CENTER.y, CENTER.z]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#6366f1" roughness={0.4} metalness={0.2} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Subject image plane (replaces sphere when an image is connected)
// ---------------------------------------------------------------------------

function SubjectImagePlane({ url }: { url: string }) {
  const texture = useTexture(url);

  const img = texture.image as HTMLImageElement | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 1;

  const maxSize = 1.2;
  const width = aspect > 1 ? maxSize : maxSize * aspect;
  const height = aspect > 1 ? maxSize / aspect : maxSize;

  return (
    <mesh position={[CENTER.x, CENTER.y, CENTER.z]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Main viewport component
// ---------------------------------------------------------------------------

export function CameraAngleViewport({
  horizontalAngle,
  verticalAngle,
  zoom,
  onAngleChange,
  onZoomChange,
  imageUrl,
}: CameraAngleViewportProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const ANGLE_STEP = 45;
      const ZOOM_STEP = 0.5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onAngleChange(
            snapToNearest((horizontalAngle - ANGLE_STEP + 360) % 360, AZIMUTH_SNAPS),
            verticalAngle,
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          onAngleChange(
            snapToNearest((horizontalAngle + ANGLE_STEP) % 360, AZIMUTH_SNAPS),
            verticalAngle,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          onAngleChange(
            horizontalAngle,
            snapToNearest(Math.min(60, verticalAngle + 30), ELEVATION_SNAPS),
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          onAngleChange(
            horizontalAngle,
            snapToNearest(Math.max(-30, verticalAngle - 30), ELEVATION_SNAPS),
          );
          break;
        case '+':
        case '=':
          e.preventDefault();
          onZoomChange(Math.min(10, zoom + ZOOM_STEP));
          break;
        case '-':
          e.preventDefault();
          onZoomChange(Math.max(0, zoom - ZOOM_STEP));
          break;
      }
    },
    [horizontalAngle, verticalAngle, zoom, onAngleChange, onZoomChange],
  );

  return (
    <div
      className="nodrag nowheel rounded-md overflow-hidden border border-border/50 focus-visible:ring-2 focus-visible:ring-ring"
      style={{ width: '100%', height: 200, touchAction: 'manipulation' }}
      role="group"
      tabIndex={0}
      aria-label={`Camera angle control — ${buildCameraPrompt(horizontalAngle, verticalAngle)} — drag handles to adjust, arrow keys to step`}
      onKeyDown={handleKeyDown}
    >
      <span className="sr-only" aria-live="polite">
        {buildCameraPrompt(horizontalAngle, verticalAngle)}
      </span>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 50, near: 0.1, far: 50 }}
        style={{ background: '#0a0a12' }}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene
          horizontalAngle={horizontalAngle}
          verticalAngle={verticalAngle}
          onAngleChange={onAngleChange}
          imageUrl={imageUrl}
        />
      </Canvas>
    </div>
  );
}

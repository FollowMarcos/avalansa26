'use client';

import * as React from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Map zoom 0–10 to camera distance 5–2 (inverted: high zoom = close) */
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 5;

/** Vertical angle limits in radians (polar angle measured from +Y axis) */
const MIN_POLAR = THREE.MathUtils.degToRad(0); // looking straight down = vertical 90°
const MAX_POLAR = THREE.MathUtils.degToRad(120); // below horizon = vertical -30°

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CameraAngleViewportProps {
  horizontalAngle: number; // 0–360 degrees
  verticalAngle: number; // -30 to 90 degrees
  zoom: number; // 0–10
  onAngleChange: (horizontal: number, vertical: number) => void;
  onZoomChange: (zoom: number) => void;
}

// ---------------------------------------------------------------------------
// Camera indicator mesh
// ---------------------------------------------------------------------------

function CameraIndicator({
  horizontalAngle,
  verticalAngle,
  zoom,
}: {
  horizontalAngle: number;
  verticalAngle: number;
  zoom: number;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const orbitRadius = 2.2;

  useFrame(() => {
    if (!meshRef.current) return;

    const hRad = THREE.MathUtils.degToRad(horizontalAngle);
    const vRad = THREE.MathUtils.degToRad(verticalAngle);

    const x = orbitRadius * Math.cos(vRad) * Math.sin(hRad);
    const y = orbitRadius * Math.sin(vRad);
    const z = orbitRadius * Math.cos(vRad) * Math.cos(hRad);

    meshRef.current.position.set(x, y, z);
    meshRef.current.lookAt(0, 0, 0);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.15, 0.35, 8]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Line from camera indicator to center
// ---------------------------------------------------------------------------

function CameraLine({
  horizontalAngle,
  verticalAngle,
}: {
  horizontalAngle: number;
  verticalAngle: number;
}) {
  const lineRef = React.useRef<THREE.Line>(null);
  const orbitRadius = 2.2;

  useFrame(() => {
    if (!lineRef.current) return;

    const hRad = THREE.MathUtils.degToRad(horizontalAngle);
    const vRad = THREE.MathUtils.degToRad(verticalAngle);

    const x = orbitRadius * Math.cos(vRad) * Math.sin(hRad);
    const y = orbitRadius * Math.sin(vRad);
    const z = orbitRadius * Math.cos(vRad) * Math.cos(hRad);

    const positions = lineRef.current.geometry.attributes.position;
    if (positions) {
      positions.setXYZ(0, 0, 0, 0);
      positions.setXYZ(1, x, y, z);
      positions.needsUpdate = true;
    }
  });

  const lineObj = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineDashedMaterial({
      color: '#22d3ee',
      dashSize: 0.1,
      gapSize: 0.08,
      opacity: 0.5,
      transparent: true,
    });
    const ln = new THREE.Line(geo, mat);
    ln.computeLineDistances();
    return ln;
  }, []);

  lineRef.current = lineObj;

  return <primitive object={lineObj} />;
}

// ---------------------------------------------------------------------------
// Orbit ring (torus showing horizontal path)
// ---------------------------------------------------------------------------

function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.2, 0.008, 8, 64]} />
      <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene controller — syncs OrbitControls ↔ props
// ---------------------------------------------------------------------------

function SceneController({
  horizontalAngle,
  verticalAngle,
  zoom,
  onAngleChange,
  onZoomChange,
}: CameraAngleViewportProps) {
  const controlsRef = React.useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const suppressCallbackRef = React.useRef(false);

  // Sync camera position when props change externally
  React.useEffect(() => {
    if (!controlsRef.current) return;

    const hRad = THREE.MathUtils.degToRad(horizontalAngle);
    // Convert vertical angle (-30 to 90) to polar angle (measured from +Y):
    // vertical 90° → polar 0° (top), vertical 0° → polar 90° (horizon), vertical -30° → polar 120°
    const polarAngle = THREE.MathUtils.degToRad(90 - verticalAngle);
    const distance = THREE.MathUtils.mapLinear(zoom, 0, 10, MAX_DISTANCE, MIN_DISTANCE);

    const x = distance * Math.sin(polarAngle) * Math.sin(hRad);
    const y = distance * Math.cos(polarAngle);
    const z = distance * Math.sin(polarAngle) * Math.cos(hRad);

    suppressCallbackRef.current = true;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    controlsRef.current.update?.();
    suppressCallbackRef.current = false;
  }, [horizontalAngle, verticalAngle, zoom, camera]);

  const handleChange = React.useCallback(() => {
    if (suppressCallbackRef.current) return;

    const spherical = new THREE.Spherical().setFromVector3(camera.position);

    // Azimuthal angle → horizontal (0–360)
    let hDeg = THREE.MathUtils.radToDeg(spherical.theta);
    if (hDeg < 0) hDeg += 360;
    hDeg = Math.round(hDeg * 10) / 10;

    // Polar angle → vertical (-30 to 90)
    const vDeg = Math.round((90 - THREE.MathUtils.radToDeg(spherical.phi)) * 10) / 10;

    // Distance → zoom (0–10, inverted)
    const z =
      Math.round(
        THREE.MathUtils.mapLinear(spherical.radius, MAX_DISTANCE, MIN_DISTANCE, 0, 10) * 10,
      ) / 10;

    onAngleChange(
      THREE.MathUtils.clamp(hDeg, 0, 360),
      THREE.MathUtils.clamp(vDeg, -30, 90),
    );
    onZoomChange(THREE.MathUtils.clamp(z, 0, 10));
  }, [camera, onAngleChange, onZoomChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping={false}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      onChange={handleChange}
    />
  );
}

// ---------------------------------------------------------------------------
// Subject sphere
// ---------------------------------------------------------------------------

function SubjectSphere() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color="#6366f1" roughness={0.4} metalness={0.2} />
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
}: CameraAngleViewportProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const ANGLE_STEP = 5;
      const ZOOM_STEP = 0.5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onAngleChange((horizontalAngle - ANGLE_STEP + 360) % 360, verticalAngle);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onAngleChange((horizontalAngle + ANGLE_STEP) % 360, verticalAngle);
          break;
        case 'ArrowUp':
          e.preventDefault();
          onAngleChange(horizontalAngle, Math.min(90, verticalAngle + ANGLE_STEP));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onAngleChange(horizontalAngle, Math.max(-30, verticalAngle - ANGLE_STEP));
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
  // Compute initial camera position from props
  const initialCameraPosition = React.useMemo<[number, number, number]>(() => {
    const hRad = THREE.MathUtils.degToRad(horizontalAngle);
    const polarAngle = THREE.MathUtils.degToRad(90 - verticalAngle);
    const distance = THREE.MathUtils.mapLinear(zoom, 0, 10, MAX_DISTANCE, MIN_DISTANCE);

    return [
      distance * Math.sin(polarAngle) * Math.sin(hRad),
      distance * Math.cos(polarAngle),
      distance * Math.sin(polarAngle) * Math.cos(hRad),
    ];
  }, []); // Only compute once on mount

  return (
    <div
      className="nodrag nowheel rounded-md overflow-hidden border border-border/50 focus-visible:ring-2 focus-visible:ring-ring"
      style={{ width: '100%', height: 180, touchAction: 'manipulation' }}
      role="group"
      tabIndex={0}
      aria-label={`Camera angle control — H:${horizontalAngle.toFixed(0)}° V:${verticalAngle.toFixed(0)}° Z:${zoom.toFixed(1)} — drag to orbit, scroll to zoom, arrow keys to adjust`}
      onKeyDown={handleKeyDown}
    >
      <Canvas
        camera={{ position: initialCameraPosition, fov: 50, near: 0.1, far: 50 }}
        style={{ background: '#0a0a12' }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <directionalLight position={[-2, 3, -3]} intensity={0.3} />

        <SubjectSphere />
        <CameraIndicator
          horizontalAngle={horizontalAngle}
          verticalAngle={verticalAngle}
          zoom={zoom}
        />
        <CameraLine horizontalAngle={horizontalAngle} verticalAngle={verticalAngle} />
        <OrbitRing />

        <Grid
          args={[10, 10]}
          position={[0, -1.2, 0]}
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

        <axesHelper args={[0.8]} />

        <SceneController
          horizontalAngle={horizontalAngle}
          verticalAngle={verticalAngle}
          zoom={zoom}
          onAngleChange={onAngleChange}
          onZoomChange={onZoomChange}
        />
      </Canvas>
    </div>
  );
}

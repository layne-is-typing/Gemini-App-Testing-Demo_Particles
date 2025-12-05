import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleProps } from '../types';
import { generateParticles } from '../utils/shapes';

// Skeleton connections (pairs of indices) for hand visualization
const BONES = [
  [0,1], [1,2], [2,3], [3,4], // Thumb
  [0,5], [5,6], [6,7], [7,8], // Index
  [0,9], [9,10], [10,11], [11,12], // Middle
  [0,13], [13,14], [14,15], [15,16], // Ring
  [0,17], [17,18], [18,19], [19,20], // Pinky
  [5,9], [9,13], [13,17] // Palm Base (partial)
];

const Particles: React.FC<ParticleProps> = ({ count, shape, color, interaction }) => {
  const mesh = useRef<THREE.Points>(null);
  const targetPositions = useMemo(() => generateParticles(shape, count), [shape, count]);
  
  // Assign each particle to a bone index for "Hands" mode to avoid runtime calculation
  const boneMap = useMemo(() => {
    const map = new Float32Array(count);
    const offsetMap = new Float32Array(count); // Random offset along the bone (0-1)
    const radialMap = new Float32Array(count); // Radius from bone center
    for(let i=0; i<count; i++) {
       map[i] = Math.floor(Math.random() * BONES.length);
       offsetMap[i] = Math.random(); 
       radialMap[i] = Math.random() * 0.08; // Thickness of finger
    }
    return { indices: map, offsets: offsetMap, radial: radialMap };
  }, [count]);

  const currentPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for(let i=0; i<arr.length; i++) arr[i] = (Math.random() - 0.5) * 5;
    return arr;
  }, [count]);
  
  const noise = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) arr[i] = (Math.random() - 0.5) * 0.02;
    return arr;
  }, [count]);

  const geometry = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (geometry.current) {
      geometry.current.attributes.position.needsUpdate = true;
    }
  }, [shape]);

  useFrame((state) => {
    if (!mesh.current || !geometry.current) return;

    const { scale, tension, present, position, landmarks } = interaction.current;
    const time = state.clock.getElapsedTime();
    const positions = geometry.current.attributes.position.array as Float32Array;
    const lerpFactor = 0.08;

    // --- Global Position Control (XY Plane) ---
    // Map normalized 0-1 video coords to World X/Y
    // Video X=0 (Left) -> World X ~ -3
    // Video X=1 (Right) -> World X ~ 3
    // Video Y=0 (Top) -> World Y ~ 2
    // Video Y=1 (Bottom) -> World Y ~ -2
    // Note: Video is mirrored logic in code usually, but position.x from tracker is raw normalized.
    // If tracker provides: left hand = low x. 
    // We want particles to follow hand.
    // Standard webgl coords: Center 0,0.
    
    let groupTargetX = 0;
    let groupTargetY = 0;

    if (present) {
       // (0.5 - pos) * multiplier
       // Invert X because camera is mirrored usually for UX
       groupTargetX = (0.5 - position.x) * 12; 
       groupTargetY = (0.5 - position.y) * 8; 
    }

    if (shape === 'hands' && present && landmarks.length > 0) {
      // --- HAND SHAPE MODE ---
      // We ignore the `groupTarget` translation for the whole mesh because 
      // the landmarks themselves contain position data. 
      // We reset mesh position to center so landmarks align correctly.
      mesh.current.position.x += (0 - mesh.current.position.x) * 0.1;
      mesh.current.position.y += (0 - mesh.current.position.y) * 0.1;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Decide which hand this particle belongs to
        // Split particles: first half -> Hand 1, second half -> Hand 2 (if exists)
        let handIndex = 0;
        if (landmarks.length > 1 && i > count / 2) {
           handIndex = 1;
        }

        const handLandmarks = landmarks[handIndex];
        const boneIdx = boneMap.indices[i];
        const [startIdx, endIdx] = BONES[boneIdx];

        // Get 3D coordinates of bone endpoints
        // MediaPipe landmarks: x,y normalized (0-1). z is relative scale.
        // Map to World Space roughly:
        const mapX = (v: number) => (0.5 - v) * 12; // Wider spread
        const mapY = (v: number) => (0.5 - v) * 8;
        const mapZ = (v: number) => v * -10; // Depth scaling

        const p1 = handLandmarks[startIdx];
        const p2 = handLandmarks[endIdx];

        const p1x = mapX(p1.x); const p1y = mapY(p1.y); const p1z = mapZ(p1.z);
        const p2x = mapX(p2.x); const p2y = mapY(p2.y); const p2z = mapZ(p2.z);

        // Interpolate along bone
        const t = boneMap.offsets[i];
        let tx = p1x + (p2x - p1x) * t;
        let ty = p1y + (p2y - p1y) * t;
        let tz = p1z + (p2z - p1z) * t;

        // Add volume (cylinder around bone)
        // Simple random noise for volume is faster than calculating perpendicular vectors
        const r = boneMap.radial[i] * (1 + tension); // Puff up with tension
        tx += (Math.random()-0.5) * r;
        ty += (Math.random()-0.5) * r;
        tz += (Math.random()-0.5) * r;

        // Update Position
        positions[i3] += (tx - positions[i3]) * 0.2; // Faster snapping for hands
        positions[i3+1] += (ty - positions[i3+1]) * 0.2;
        positions[i3+2] += (tz - positions[i3+2]) * 0.2;
      }

    } else {
      // --- TEMPLATE SHAPE MODE ---
      // Move the container to follow hand
      mesh.current.position.x += (groupTargetX - mesh.current.position.x) * 0.05;
      mesh.current.position.y += (groupTargetY - mesh.current.position.y) * 0.05;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 1. Target
        let tx = targetPositions[i3] * scale;
        let ty = targetPositions[i3 + 1] * scale;
        let tz = targetPositions[i3 + 2] * scale;

        // 2. Interaction
        if (present) {
           const jitter = tension * 0.2; 
           tx += (Math.random() - 0.5) * jitter;
           ty += (Math.random() - 0.5) * jitter;
           tz += (Math.random() - 0.5) * jitter;
        } else {
           const idleScale = 1 + Math.sin(time * 0.5) * 0.1;
           tx *= idleScale;
           ty *= idleScale;
           tz *= idleScale;
           ty += Math.sin(time + positions[i3] * 0.5) * 0.1;
        }

        // 3. Update
        positions[i3] += (tx - positions[i3]) * lerpFactor;
        positions[i3 + 1] += (ty - positions[i3 + 1]) * lerpFactor;
        positions[i3 + 2] += (tz - positions[i3 + 2]) * lerpFactor;

        // 4. Noise
        positions[i3] += noise[i3] * (1 + tension * 5); 
        positions[i3+1] += noise[i3+1] * (1 + tension * 5);
        positions[i3+2] += noise[i3+2] * (1 + tension * 5);
      }
      
      // Rotate slowly if not in hand mode
      mesh.current.rotation.y += 0.002 + (tension * 0.02);
    }

    geometry.current.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const ParticleScene: React.FC<ParticleProps> = (props) => {
  return (
    <Canvas className="w-full h-full bg-neutral-900">
      <PerspectiveCamera makeDefault position={[0, 0, 6]} />
      <ambientLight intensity={0.5} />
      
      <Particles {...props} />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate={false}
      />
    </Canvas>
  );
};
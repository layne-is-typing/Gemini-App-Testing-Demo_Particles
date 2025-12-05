import React from 'react';

export type ShapeType = 'sphere' | 'heart' | 'flower' | 'saturn' | 'buddha' | 'fireworks' | 'hands';

export interface AppState {
  shape: ShapeType;
  color: string;
  particleCount: number;
}

export interface HandInteraction {
  scale: number;    // Controlled by distance between hands (or pinch if 1 hand)
  tension: number;  // Controlled by how closed the hands are (0 = open palm, 1 = fist)
  present: boolean; // Are hands detected?
  position: { x: number, y: number }; // Center of hands (0-1)
  landmarks: { x: number, y: number, z: number }[][]; // Raw landmarks for 3D shape
}

export interface ParticleProps {
  count: number;
  shape: ShapeType;
  color: string;
  interaction: React.MutableRefObject<HandInteraction>;
}
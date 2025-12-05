import * as THREE from 'three';
import { ShapeType } from '../types';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateParticles = (type: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const i3 = i * 3;

    switch (type) {
      case 'sphere': 
      case 'hands': { 
        // Hands start as a sphere/cloud before the first frame of tracking
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 2;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
      case 'heart': {
        // Parametric heart
        const t = Math.random() * Math.PI * 2;
        const r = random(0.8, 1.2) * 0.15; 
        const xt = 16 * Math.pow(Math.sin(t), 3);
        const yt = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        x = xt * r;
        y = yt * r + 1; 
        z = random(-0.5, 0.5); 
        break;
      }
      case 'flower': {
        const theta = Math.random() * Math.PI * 2;
        const k = 5; 
        const rBase = Math.cos(k * theta);
        const r = (2 + rBase) * 0.8;
        x = r * Math.cos(theta);
        y = r * Math.sin(theta);
        z = (Math.random() - 0.5) * 0.5 + (rBase * 0.5); 
        break;
      }
      case 'saturn': {
        if (Math.random() > 0.3) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 1.2;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        } else {
          const theta = Math.random() * Math.PI * 2;
          const r = random(1.8, 3.5);
          x = r * Math.cos(theta);
          z = r * Math.sin(theta);
          y = random(-0.1, 0.1);
          const tilt = Math.PI / 6;
          const tempX = x;
          const tempY = y;
          x = tempX * Math.cos(tilt) - tempY * Math.sin(tilt);
          y = tempX * Math.sin(tilt) + tempY * Math.cos(tilt);
        }
        break;
      }
      case 'buddha': {
        const part = Math.random();
        if (part < 0.2) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 0.5;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) + 1.2;
          z = r * Math.cos(phi);
        } else if (part < 0.6) {
          const theta = Math.random() * Math.PI * 2;
          const h = Math.random() * 1.5; 
          const r = 0.8 * (1 - h * 0.3); 
          x = r * Math.cos(theta);
          y = h - 0.5;
          z = r * Math.sin(theta);
        } else {
          const theta = Math.random() * Math.PI * 2;
          const r = random(0.5, 1.5);
          const thickness = random(-0.2, 0.2);
          x = r * Math.cos(theta);
          y = -0.5 + thickness;
          z = r * Math.sin(theta);
        }
        break;
      }
      case 'fireworks': {
         const theta = Math.random() * Math.PI * 2;
         const phi = Math.acos(2 * Math.random() - 1);
         const r = Math.pow(Math.random(), 2) * 4; 
         x = r * Math.sin(phi) * Math.cos(theta);
         y = r * Math.sin(phi) * Math.sin(theta);
         z = r * Math.cos(phi);
         break;
      }
      default:
        break;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return positions;
};
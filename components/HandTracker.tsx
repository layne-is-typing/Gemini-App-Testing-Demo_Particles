import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandInteraction } from '../types';

interface HandTrackerProps {
  onInteractionUpdate: (data: HandInteraction) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onInteractionUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number>();
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  // Constants for smoothing
  const interactionRef = useRef<HandInteraction>({ 
    scale: 1, 
    tension: 0, 
    present: false,
    position: { x: 0.5, y: 0.5 },
    landmarks: []
  });

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        startCamera();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    init();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;

    if (videoRef.current.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = videoRef.current.currentTime;
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      processResults(results);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const processResults = (results: HandLandmarkerResult) => {
    const hands = results.landmarks;
    let newScale = interactionRef.current.scale;
    let newTension = 0;
    let isPresent = false;
    let avgX = 0.5;
    let avgY = 0.5;

    if (hands.length > 0) {
      isPresent = true;
      let totalX = 0;
      let totalY = 0;
      
      // Calculate Centroid
      hands.forEach(hand => {
        // Use Wrist (0) and Middle Finger MCP (9) to approximate center
        totalX += hand[0].x;
        totalY += hand[0].y;
        totalX += hand[9].x;
        totalY += hand[9].y;
      });
      avgX = totalX / (hands.length * 2);
      avgY = totalY / (hands.length * 2);
    }

    if (hands.length === 2) {
      // 2 Hands: Scale based on distance between wrists
      const hand1 = hands[0][0];
      const hand2 = hands[1][0];
      const dist = Math.sqrt(
        Math.pow(hand1.x - hand2.x, 2) + 
        Math.pow(hand1.y - hand2.y, 2)
      );
      
      newScale = Math.max(0.2, Math.min(3.0, dist * 3.5));

      const t1 = calculateHandTension(hands[0]);
      const t2 = calculateHandTension(hands[1]);
      newTension = (t1 + t2) / 2;

    } else if (hands.length === 1) {
      // 1 Hand: Scale based on pinch
      const h = hands[0];
      const pinchDist = Math.sqrt(
        Math.pow(h[4].x - h[8].x, 2) + 
        Math.pow(h[4].y - h[8].y, 2)
      );
      newScale = 0.5 + (pinchDist * 8); 
      newTension = calculateHandTension(hands[0]);
    } else {
      isPresent = false;
      newTension = 0;
      // Keep old scale/pos or reset? Let's drift to center slowly
      avgX = 0.5;
      avgY = 0.5;
    }

    // Smooth lerp
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    interactionRef.current.scale = lerp(interactionRef.current.scale, isPresent ? newScale : 1, 0.1);
    interactionRef.current.tension = lerp(interactionRef.current.tension, newTension, 0.1);
    interactionRef.current.position.x = lerp(interactionRef.current.position.x, avgX, 0.1);
    interactionRef.current.position.y = lerp(interactionRef.current.position.y, avgY, 0.1);
    interactionRef.current.present = isPresent;
    interactionRef.current.landmarks = hands; // Pass raw data

    onInteractionUpdate(interactionRef.current);
  };

  const calculateHandTension = (landmarks: any[]) => {
    // 0 = Wrist, 5 = Index MCP
    const palmSize = Math.sqrt(
      Math.pow(landmarks[0].x - landmarks[5].x, 2) + 
      Math.pow(landmarks[0].y - landmarks[5].y, 2)
    );

    const tips = [8, 12, 16, 20];
    let avgDistToWrist = 0;
    tips.forEach(idx => {
      avgDistToWrist += Math.sqrt(
        Math.pow(landmarks[idx].x - landmarks[0].x, 2) + 
        Math.pow(landmarks[idx].y - landmarks[0].y, 2)
      );
    });
    avgDistToWrist /= 4;

    const ratio = avgDistToWrist / (palmSize || 0.1);
    let tension = 1 - (ratio - 0.8); 
    return Math.max(0, Math.min(1, tension));
  };

  return (
    // Hidden Video Element for Logic Only
    <video 
      ref={videoRef} 
      className="fixed opacity-0 pointer-events-none -scale-x-100" 
      autoPlay 
      muted
      playsInline
    />
  );
};
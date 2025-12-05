import React, { useState, useRef, useEffect } from 'react';
import { ParticleScene } from './components/ParticleScene';
import { HandTracker } from './components/HandTracker';
import { UIControls } from './components/UIControls';
import { ShapeType, HandInteraction } from './types';

function App() {
  const [shape, setShape] = useState<ShapeType>('buddha');
  const [color, setColor] = useState<string>('#5555ff');
  const [handStatus, setHandStatus] = useState<HandInteraction>({ scale: 1, tension: 0, present: false });
  
  // We use a ref for the high-frequency particle updates to avoid re-rendering the whole tree
  // The 'handStatus' state above is throttled or just used for UI
  const interactionRef = useRef<HandInteraction>({ scale: 1, tension: 0, present: false });

  const handleInteractionUpdate = (data: HandInteraction) => {
    // Direct ref update for Three.js (no re-render)
    interactionRef.current = data;
    
    // Throttled state update for UI (visual feedback)
    // Only update UI every 100ms or so if strictly needed, but React 18 batching handles this reasonably well
    // To be safe and performant, we might not set state every frame.
    // For this demo, let's sync them for responsiveness but maybe skip every other frame if heavy.
    // Actually, setting state 60fps in root might be heavy. Let's use a simple frame skip.
    if (Math.random() > 0.8) { 
       setHandStatus({ ...data }); 
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleScene 
          count={12000} 
          shape={shape} 
          color={color} 
          interaction={interactionRef}
        />
      </div>

      {/* Vision Logic (Hidden or Small) */}
      <HandTracker onInteractionUpdate={handleInteractionUpdate} />

      {/* UI Layer */}
      <UIControls 
        currentShape={shape} 
        setShape={setShape} 
        currentColor={color} 
        setColor={setColor}
        handStatus={handStatus}
      />
      
      {/* Background Gradient Mesh Effect (CSS) for atmosphere */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />

    </div>
  );
}

export default App;

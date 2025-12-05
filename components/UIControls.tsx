import React from 'react';
import { ShapeType } from '../types';
import { Shapes, Palette, Hand, HelpCircle } from 'lucide-react';

interface UIControlsProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  handStatus: { present: boolean; scale: number; tension: number };
}

export const UIControls: React.FC<UIControlsProps> = ({ 
  currentShape, 
  setShape, 
  currentColor, 
  setColor,
  handStatus
}) => {
  const shapes: ShapeType[] = ['sphere', 'heart', 'flower', 'saturn', 'buddha', 'fireworks', 'hands'];

  return (
    <>
      {/* Main Control Panel */}
      <div className="fixed top-4 left-4 z-40 flex flex-col gap-4">
        
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl w-64">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ZenParticles
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time Gesture Control
          </p>
        </div>

        {/* Shape Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl w-64">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white/90">
            <Shapes className="w-4 h-4 text-purple-400" />
            <span>Shape Template</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map(shape => (
              <button
                key={shape}
                onClick={() => setShape(shape)}
                className={`
                  px-3 py-2 text-xs rounded-lg capitalize transition-all duration-200 border
                  ${currentShape === shape 
                    ? 'bg-white/10 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-neutral-400 hover:text-white'}
                `}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl w-64">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white/90">
            <Palette className="w-4 h-4 text-blue-400" />
            <span>Particle Color</span>
          </div>
          <div className="flex gap-2 justify-between">
             {['#ffffff', '#ff5555', '#55ff55', '#5555ff', '#ff55ff', '#ffff55'].map(color => (
               <button
                 key={color}
                 onClick={() => setColor(color)}
                 style={{ backgroundColor: color }}
                 className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${currentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
               />
             ))}
             <input 
               type="color" 
               value={currentColor} 
               onChange={(e) => setColor(e.target.value)}
               className="w-6 h-6 rounded-full overflow-hidden opacity-0 absolute pointer-events-none" 
             />
             <label className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10">
               <span className="text-[8px]">+</span>
               <input 
                 type="color" 
                 className="opacity-0 absolute"
                 onChange={(e) => setColor(e.target.value)}
               />
             </label>
          </div>
        </div>
      </div>

      {/* Status Overlay */}
      <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
         <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${handStatus.present ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <span className="text-xs font-mono text-neutral-300">
               {handStatus.present ? 'Sensors Active' : 'No Signal'}
             </span>
             <Hand className="w-4 h-4 text-neutral-500" />
         </div>

         {handStatus.present && (
           <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 w-48 transition-opacity duration-500">
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
                   <span>Expansion</span>
                   <span>{handStatus.scale.toFixed(1)}x</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                     style={{ width: `${Math.min(100, handStatus.scale * 33)}%` }}
                   />
                </div>

                <div className="flex justify-between text-[10px] text-neutral-400 uppercase tracking-wider mt-2">
                   <span>Tension</span>
                   <span>{(handStatus.tension * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-purple-500 transition-all duration-100 ease-linear"
                     style={{ width: `${handStatus.tension * 100}%` }}
                   />
                </div>
             </div>
           </div>
         )}
      </div>
      
      {/* Help Tip */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
         <div className="bg-black/60 backdrop-blur px-6 py-3 rounded-full text-white/80 text-sm border border-white/5 flex items-center gap-2 animate-fade-in-up">
            <HelpCircle className="w-4 h-4" />
            <span>Move hands to control position. Switch to <span className="text-purple-400 font-bold">'Hands'</span> template to mirror gestures.</span>
         </div>
      </div>
    </>
  );
};

import React from 'react';

interface ThreeDCubeProps {
  rotation: number;
  tilt: number;
  zoom: number;
  previewImage?: string | null;
}

const ThreeDCube: React.FC<ThreeDCubeProps> = ({ rotation, tilt, zoom, previewImage }) => {
  // Zoom 값을 스케일로 변환 (-50 -> 0.6, 0 -> 1.0, 50 -> 1.6)
  const scale = 1 + (zoom / 80);

  return (
    <div className="flex items-center justify-center h-56 bg-[#0f172a] rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
      <div className="absolute top-4 left-4 z-10">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Drag to rotate view freely</span>
      </div>
      
      <div 
        className="w-32 h-32 relative preserve-3d transition-all duration-300 ease-out cursor-move"
        style={{ 
          transform: `rotateX(${-tilt}deg) rotateY(${rotation}deg) scale(${scale})` 
        }}
      >
        {/* Faces of the cube */}
        {[
          { transform: 'translateZ(64px)', label: 'FRONT', color: 'bg-slate-800/40', image: previewImage },
          { transform: 'rotateY(180deg) translateZ(64px)', label: 'BACK', color: 'bg-slate-900/40' },
          { transform: 'rotateY(90deg) translateZ(64px)', label: 'RIGHT', color: 'bg-slate-900/40' },
          { transform: 'rotateY(-90deg) translateZ(64px)', label: 'LEFT', color: 'bg-slate-900/40' },
          { transform: 'rotateX(90deg) translateZ(64px)', label: 'TOP', color: 'bg-slate-900/40' },
          { transform: 'rotateX(-90deg) translateZ(64px)', label: 'BOTTOM', color: 'bg-slate-900/40' },
        ].map((face, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center border border-white/10 text-[10px] font-black text-slate-600 ${face.color}`}
            style={{ 
              transform: face.transform, 
              backfaceVisibility: 'hidden',
              backgroundImage: face.image ? `url(${face.image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!face.image && face.label}
          </div>
        ))}
      </div>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default ThreeDCube;

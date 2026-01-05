import React from 'react';

interface OxygenTankProps {
  percentage: number; // 0 to 100 (Remaining Air)
  isCritical: boolean;
}

export const OxygenTank: React.FC<OxygenTankProps> = ({ percentage, isCritical }) => {
  // Clamped percentage for the liquid height
  const height = Math.max(0, Math.min(100, percentage));
  
  // Colors
  const liquidColor = isCritical ? '#ff3333' : '#00f0ff';
  const glowColor = isCritical ? 'rgba(255, 50, 50, 0.6)' : 'rgba(0, 240, 255, 0.4)';

  return (
    <div style={{ position: 'relative', width: 200, height: 60, display: 'flex', alignItems: 'center' }}>
      
      {/* THE CONTAINER (Glass Tube) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 36,
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 18,
        border: '2px solid #444',
        boxShadow: `inset 0 0 10px #000, 0 0 15px ${isCritical ? 'rgba(255,0,0,0.2)' : 'rgba(0,0,0,0)'}`,
        overflow: 'hidden'
      }}>
        
        {/* LIQUID WAVE */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${height}%`,
          background: `linear-gradient(90deg, ${liquidColor}, ${isCritical ? '#aa0000' : '#00a0aa'})`,
          transition: 'width 0.5s linear, background 0.5s',
          boxShadow: `0 0 20px ${glowColor}`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          
          {/* Bubbles Overlay (CSS Animation) */}
          <div className="bubbles" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            opacity: 0.5,
            animation: 'bubbleScroll 2s linear infinite'
          }} />

          {/* The "Surface" Highlight line */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 10px white',
            opacity: height > 2 ? 1 : 0
          }} />
        </div>

        {/* GLASS REFLECTION (Static Shine) */}
        <div style={{
          position: 'absolute', top: 3, left: 10, right: 10, height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0))',
          borderRadius: 20,
          pointerEvents: 'none'
        }} />

        {/* WARNING STRIPES (When Critical) */}
        {isCritical && (
           <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)',
              pointerEvents: 'none'
           }} />
        )}
      </div>

      {/* TEXT LABEL OVERLAY */}
      <div style={{
        position: 'absolute',
        right: 15,
        color: '#fff',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textShadow: '0 0 5px black',
        zIndex: 2,
        fontSize: '0.9rem',
        letterSpacing: 1
      }}>
        {height < 20 ? 'CRITICAL' : 'OXYGEN'}
      </div>

      {/* GLOBAL KEYFRAMES FOR BUBBLES */}
      <style>{`
        @keyframes bubbleScroll {
          0% { background-position: 0 0; }
          100% { background-position: 5px -10px; }
        }
      `}</style>
    </div>
  );
};
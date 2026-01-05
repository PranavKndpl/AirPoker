import React, { useState } from "react";

interface Props {
  currentBios: number;
  onPlaceBet: (amount: number) => void;
  onToggleView: () => void;
}

export const BettingPanel: React.FC<Props> = ({ currentBios, onPlaceBet, onToggleView }) => {
  const [bet, setBet] = useState(0);

  // Helper for color change based on risk
  const riskPct = (bet / currentBios);
  const riskColor = riskPct > 0.8 ? '#ff3333' : riskPct > 0.4 ? '#ffaa00' : '#00f0ff';

  return (
    <div style={{
      position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
      zIndex: 20, width: 480,
      animation: "slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    }}>
      
      {/* GLASS PANEL */}
      <div style={{
        background: "rgba(10, 15, 20, 0.9)",
        backdropFilter: "blur(12px)",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.5)",
        padding: "30px",
        display: "flex", flexDirection: "column", gap: 20
      }}>

        {/* HEADER / EYE TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#667', letterSpacing: 2, fontWeight: 'bold' }}>
            STAKES
          </div>
          <button 
             onClick={onToggleView}
             style={{ 
               background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', 
               opacity: 0.6, transition: 'opacity 0.2s' 
             }}
             title="Inspect Table"
          >
            👁️
          </button>
        </div>

        {/* DIGITAL DISPLAY */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 8,
          border: `1px solid ${riskColor}`,
          padding: '20px',
          textAlign: 'center',
          boxShadow: `inset 0 0 20px ${riskColor}20`
        }}>
          <div style={{ 
            fontSize: '4rem', fontWeight: 'bold', fontFamily: 'monospace', 
            color: riskColor, textShadow: `0 0 15px ${riskColor}60`, lineHeight: 1 
          }}>
            {bet}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem', marginTop: 5, letterSpacing: 1 }}>
            BIOS WAGERED
          </div>
        </div>

        {/* SLIDER */}
        <div style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max={currentBios}
            value={bet}
            onChange={e => setBet(parseInt(e.target.value))}
            style={{
              width: "100%", cursor: "pointer", accentColor: riskColor,
              height: 6, borderRadius: 3, background: '#333', appearance: 'auto'
            }}
          />
        </div>

        {/* PRESET BUTTONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <button onClick={() => setBet(0)} style={presetBtnStyle}>CHECK</button>
          <button onClick={() => setBet(Math.floor(currentBios / 2))} style={presetBtnStyle}>50%</button>
          <button 
            onClick={() => setBet(currentBios)} 
            style={{ ...presetBtnStyle, color: '#ff3333', borderColor: '#ff3333' }}
          >
            MAX
          </button>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={() => onPlaceBet(bet)}
          style={{
            background: riskColor,
            color: '#000',
            border: 'none',
            padding: '18px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 10,
            boxShadow: `0 0 20px ${riskColor}40`,
            textTransform: 'uppercase',
            letterSpacing: 1,
            transition: 'all 0.2s'
          }}
        >
          {bet >= currentBios ? " ALL IN" : bet === 0 ? "CHECK (0 BIOS)" : "CONFIRM WAGER"}
        </button>

      </div>
      
      {/* SLIDE ANIMATION */}
      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 50px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const presetBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#aaa',
  padding: '10px',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  transition: 'all 0.2s'
};
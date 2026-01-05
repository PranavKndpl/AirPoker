// client/src/components/UI/GameHUD.tsx
import React from "react";
import { OxygenTank } from "./OxygenTank"; // 👈 IMPORT THIS

interface GameHUDProps {
  roomId: string | null;
  timer: number;
  pot: number;
  bios: number;
  opponentBios: number;
  phase: string;
  myWins?: number;
  opponentWins?: number;
  oxygenProgress: number; // 0 to 60 (Decay count)
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  roomId, timer, pot, bios, opponentBios, phase, 
  myWins = 0, opponentWins = 0, oxygenProgress 
}) => {
  
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Logic: oxygenProgress is how much has DECAYED (0 -> 60).
  // We want the bar to show how much is LEFT (100% -> 0%).
  const decayedPct = (oxygenProgress / 60) * 100;
  const remainingPct = 100 - decayedPct;
  const isCritical = remainingPct < 15; // Red Alert below 15%

  return (
    <div style={hudContainerStyle}>
      
      {/* --- LEFT SECTION: SURVIVAL --- */}
      <div style={leftSectionStyle}>
        
        {/* Title & Room */}
        <h1 style={titleStyle}>AIR POKER</h1>
        <div style={{color: '#666', fontSize: '0.8rem', marginTop: 0, fontFamily: 'monospace', marginBottom: 15}}>
           ROOM: {roomId || "---"}
        </div>

        {/* Timer */}
        <div style={timerStyle}>
          {formatTime(timer)}
        </div>

        {/* 🫁 THE NEW TANK UI */}
        <div style={{marginTop: 15, display: 'flex', alignItems: 'center', gap: 15}}>
           
           {/* Lungs Icon (Pulse Animation) */}
           <div style={{
              fontSize: '2rem', 
              animation: isCritical ? 'gasp 0.5s infinite alternate' : 'breathe 3s infinite ease-in-out',
              opacity: isCritical ? 1 : 0.8,
              filter: isCritical ? 'drop-shadow(0 0 8px #ff0000)' : 'drop-shadow(0 0 5px #00f0ff)'
           }}>
              🫁
           </div>

           {/* ⚡️ THE LIQUID TANK ⚡️ */}
           <OxygenTank percentage={remainingPct} isCritical={isCritical} />
           
        </div>

      </div>

      {/* --- CENTER SECTION: SCORE --- */}
      <div style={centerScoreStyle}>
        <div style={scoreBoxStyle}>
           <div style={{fontSize: '0.7rem', color: '#888', letterSpacing: 1}}>MATCH SCORE</div>
           <div style={{fontSize: '1.8rem', color: '#ffd700', fontWeight: 'bold', lineHeight: 1}}>
             {myWins} - {opponentWins}
           </div>
        </div>
      </div>

      {/* --- RIGHT SECTION: ECONOMICS --- */}
      <div style={rightSectionStyle}>
        <div style={potStyle}>POT: {pot}</div>
        <div style={bioStyle}>YOU: <span style={{color: '#fff'}}>{bios}</span></div>
        <div style={bioStyle}>OPP: <span style={{color: '#aaa'}}>{opponentBios}</span></div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes breathe {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes gasp {
          0% { transform: scale(0.9); filter: grayscale(1); }
          100% { transform: scale(1.2); filter: grayscale(0); }
        }
      `}</style>

    </div>
  );
};

/* --- STYLES --- */
const hudContainerStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100%", 
  padding: "20px 40px", boxSizing: "border-box",
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  pointerEvents: "none", zIndex: 10
};
const leftSectionStyle: React.CSSProperties = { 
  pointerEvents: "none", textAlign: "left", display: 'flex', flexDirection: 'column' 
};
const rightSectionStyle: React.CSSProperties = { 
  textAlign: "right", pointerEvents: "none" 
};
const centerScoreStyle: React.CSSProperties = {
  position: 'absolute', left: '50%', top: 20, transform: 'translateX(-50%)',
  textAlign: 'center'
};
const titleStyle: React.CSSProperties = { 
  margin: 0, fontSize: "1.8rem", color: "#ffd700", textShadow: "0 0 10px #eebb00", 
  fontFamily: 'sans-serif', fontWeight: 900, letterSpacing: -1
};
const timerStyle: React.CSSProperties = { 
  fontSize: "2.5rem", fontWeight: "bold", color: "#fff", lineHeight: 1, letterSpacing: 2
};
const scoreBoxStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.8)', padding: '10px 30px', borderRadius: 12, 
  border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
};
const potStyle: React.CSSProperties = { 
  fontSize: "1.8rem", fontWeight: "bold", color: "#ffd700", marginBottom: 5, textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
};
const bioStyle: React.CSSProperties = { 
  fontSize: "1.1rem", color: "#888", fontWeight: "bold", letterSpacing: 1
};
import React from "react";

interface GameHUDProps {
  roomId: string | null;
  timer: number;
  pot: number;
  bios: number;
  opponentBios: number;
  phase: string;
  myWins?: number;
  opponentWins?: number;
  oxygenProgress: number; // 0 to 60
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

  // Oxygen Calculation
  const pct = (oxygenProgress / 60) * 100;
  const isCritical = pct > 85;

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

        {/* 🫁 OXYGEN BAR (New Location) */}
        <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 10}}>
           
           {/* Lungs Icon (Pulse Animation) */}
           <div style={{
              fontSize: '1.5rem', 
              animation: isCritical ? 'gasp 0.5s infinite alternate' : 'breathe 3s infinite ease-in-out',
              opacity: isCritical ? 1 : 0.7,
              filter: isCritical ? 'drop-shadow(0 0 5px #ff0000)' : 'none'
           }}>
              🫁
           </div>

           {/* The Bar */}
           <div style={{flex: 1, minWidth: 120}}>
              <div style={{
                 width: '100%', height: 8, background: '#222', 
                 borderRadius: 4, overflow: 'hidden', border: '1px solid #444'
              }}>
                 <div style={{
                    width: `${100 - pct}%`, // Depletes from 100% to 0%
                    height: '100%',
                    background: isCritical ? '#ff4444' : 'linear-gradient(90deg, #00ff88, #00aa55)',
                    transition: 'width 1s linear',
                    boxShadow: isCritical ? '0 0 10px #ff0000' : 'none'
                 }} />
              </div>
           </div>
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

      {/* Inject Keyframes for Breathing */}
      <style>{`
        @keyframes breathe {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        @keyframes gasp {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.2); }
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
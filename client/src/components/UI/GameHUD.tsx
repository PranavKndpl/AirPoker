import React from "react";

interface GameHUDProps {
  roomId: string | null;
  timer: number;
  pot: number;
  bios: number;
  opponentBios: number;
  phase: string;
  // ✅ Optional match score
  myWins?: number;
  opponentWins?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  roomId, timer, pot, bios, opponentBios, phase, 
  myWins = 0, opponentWins = 0 // ✅ Defaults to 0
}) => {
  
  // Helper to format time (e.g., "60s")
  const formatTime = (t: number) => `${t}s`;

  return (
    <div style={hudContainerStyle}>
      
      {/* LEFT: Room & Timer */}
      <div style={leftSectionStyle}>
        <h1 style={titleStyle}>AIR POKER</h1>
        {/* ✅ Room ID */}
        <div style={{color: '#666', fontSize: '0.8rem', marginTop: 5, fontFamily: 'monospace'}}>
           ROOM: {roomId || "---"}
        </div>
        <div style={timerStyle}>
          ⏳ {formatTime(timer)}
        </div>
      </div>

      {/* CENTER: Match Score */}
      <div style={centerScoreStyle}>
        <div style={scoreBoxStyle}>
           <div style={{fontSize: '0.8rem', color: '#888'}}>WINS</div>
           <div style={{fontSize: '1.5rem', color: '#ffd700', fontWeight: 'bold'}}>
             {myWins} - {opponentWins}
           </div>
        </div>
      </div>

      {/* RIGHT: Economics */}
      <div style={rightSectionStyle}>
        <div style={potStyle}>POT: {pot}</div>
        <div style={bioStyle}>YOU: {bios} BIOS</div>
        <div style={bioStyle}>OPP: {opponentBios} BIOS</div>
      </div>

    </div>
  );
};


// ... keep the rest of your styles: leftSectionStyle, centerScoreStyle, rightSectionStyle, titleStyle, timerStyle, scoreBoxStyle, potStyle, bioStyle


/* --- ADDED STYLE FOR SCORE --- */
const centerScoreStyle: React.CSSProperties = {
  position: 'absolute', left: '50%', top: 20, transform: 'translateX(-50%)',
  textAlign: 'center'
};
const scoreBoxStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)', padding: '5px 20px', borderRadius: 8, border: '1px solid #333'
};

// ... (Keep your existing styles for hudContainerStyle, leftSectionStyle, etc.)
const hudContainerStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100%", 
  padding: "20px 40px", // ✅ Keeps content away from edges
  boxSizing: "border-box", // ✅ Ensures padding doesn't break width
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  pointerEvents: "none", zIndex: 10
};
// ... rest of your styles
const leftSectionStyle: React.CSSProperties = { pointerEvents: "none" };
const rightSectionStyle: React.CSSProperties = { textAlign: "right", pointerEvents: "none" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "2rem", color: "#ffd700", textShadow: "0 0 10px #eebb00" };
const timerStyle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: "bold", color: "#fff", marginTop: 5 };
const potStyle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: "bold", color: "#ffd700", marginBottom: 5 };
const bioStyle: React.CSSProperties = { fontSize: "1rem", color: "#ccc" };
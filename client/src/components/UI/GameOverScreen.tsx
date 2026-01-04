import React from "react";

interface GameOverProps {
  winnerId: string | null; // The ID of the winner (or null for Draw)
  myId: string;
  reason: "Bankruptcy" | "LIMIT_REACHED";
  finalBios?: Record<string, number>;
}

export const GameOverScreen: React.FC<GameOverProps> = ({ winnerId, myId, reason, finalBios }) => {
  
  const isWinner = winnerId === myId;
  const isDraw = winnerId === null;

  // Cinematic Text Logic
  const title = isDraw ? "DRAW" : isWinner ? "VICTORY" : "DEFEAT";
  const color = isDraw ? "#888" : isWinner ? "#00ff88" : "#ff4444";
  
  const subText = reason === "Bankruptcy" 
    ? (isWinner ? "Opponent ran out of Air." : "You ran out of Air.")
    : "5 Rounds Completed. Air Supply check.";

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <h1 style={{ ...titleStyle, color }}>{title}</h1>
        
        <div style={{ fontSize: "1.5rem", color: "#ccc", marginBottom: 40 }}>
          {subText}
        </div>

        {/* STATS DISPLAY */}
        {finalBios && (
           <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 40 }}>
              <div>
                 <div style={{color: '#888', fontSize: '0.9rem'}}>YOU</div>
                 <div style={{fontSize: '2rem', color: '#fff'}}>{finalBios[myId] ?? 0}</div>
              </div>
              <div>
                 <div style={{color: '#888', fontSize: '0.9rem'}}>OPPONENT</div>
                 <div style={{fontSize: '2rem', color: '#fff'}}>
                    {Object.entries(finalBios).find(([id]) => id !== myId)?.[1] ?? 0}
                 </div>
              </div>
           </div>
        )}

        <button 
          onClick={() => window.location.reload()} 
          style={btnStyle}
        >
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  );
};

// Reuse your styles from ResultScreen to keep it consistent
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 11000, pointerEvents: "auto"
};
const panelStyle: React.CSSProperties = {
  textAlign: "center", background: "#050505",
  padding: "60px", border: "1px solid #333", borderRadius: 12,
  minWidth: 500, boxShadow: "0 0 50px rgba(0,0,0,0.8)"
};
const titleStyle: React.CSSProperties = {
  fontSize: "4rem", marginBottom: 20, letterSpacing: 4, textTransform: "uppercase"
};
const btnStyle: React.CSSProperties = {
  padding: "15px 40px", background: "#333", color: "white",
  border: "1px solid #555", fontSize: "1.2rem", cursor: "pointer",
  marginTop: 20, borderRadius: 4
};
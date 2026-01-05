import React from "react";
import { socket } from "../../network/socketBridge";

interface GameOverProps {
  winnerId: string | null;
  myId: string;
  reason: string;
  finalBios?: Record<string, number>;
}

export const GameOverScreen: React.FC<GameOverProps> = ({ winnerId, myId, reason, finalBios }) => {
  
  const isWinner = winnerId === myId;
  const isDraw = winnerId === "DRAW";

  const title = isDraw ? "MATCH DRAW" : isWinner ? "MATCH WON" : "MATCH LOST";
  const titleColor = isDraw ? "#fff" : isWinner ? "#00ff88" : "#ff4444";
  const subText = isWinner ? "Opponent Eliminated." : "You have been Eliminated.";

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        
        {/* MAIN TITLE */}
        <h1 style={{ 
          fontSize: "5rem", margin: "0 0 20px 0", 
          color: titleColor, textShadow: `0 0 50px ${titleColor}40`,
          letterSpacing: 10, textTransform: "uppercase"
        }}>
          {title}
        </h1>

        <div style={{ fontSize: "1.5rem", color: "#888", marginBottom: 60, fontFamily: "monospace" }}>
          REASON: <span style={{ color: "#fff" }}>{reason}</span>
          <br/>
          {subText}
        </div>

        {/* STATS COMPARISON */}
        {finalBios && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 100, marginBottom: 60 }}>
            {/* YOU */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: 10, letterSpacing: 2 }}>
                YOU
              </div>
              <div style={{ fontSize: '3rem', color: isWinner ? '#ffd700' : '#444', fontWeight: 'bold' }}>
                {finalBios[myId] ?? 0}
              </div>
            </div>

            {/* VS */}
            <div style={{ alignSelf: 'center', fontSize: '2rem', color: '#333', fontStyle: 'italic' }}>
              VS
            </div>

            {/* OPPONENT */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: 10, letterSpacing: 2 }}>
                OPPONENT
              </div>
              <div style={{ fontSize: '3rem', color: !isWinner ? '#ffd700' : '#444', fontWeight: 'bold' }}>
                 {Object.entries(finalBios).find(([id]) => id !== myId)?.[1] ?? 0}
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button 
          onClick={() => window.location.reload()} 
          style={restartBtnStyle}
        >
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  );
};

/* --- STYLES --- */
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 11000, pointerEvents: "auto"
};

const panelStyle: React.CSSProperties = {
  textAlign: "center", width: "100%"
};

const restartBtnStyle: React.CSSProperties = {
  padding: "20px 60px", background: "transparent", color: "#fff",
  border: "2px solid #333", borderRadius: 0, fontSize: "1.2rem", 
  letterSpacing: 4, cursor: "pointer", transition: "all 0.2s"
};
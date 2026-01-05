// client/src/components/UI/ResultScreen.tsx
import React from "react";
import type { PlayingCard } from "../../../../shared/types";

/* --- INTERFACES --- */
interface HandInfo {
  name: string;
  strength: number;
  cards?: PlayingCard[];
}

interface RoundResult {
  outcome: "WIN" | "LOSE" | "DRAW";
  playerHand?: HandInfo;
  opponentHand?: HandInfo;
  opponentTargetValue?: number;
}

interface ResultScreenProps {
  result: RoundResult;
  onNextRound: () => void;
}

/* --- MINI CARD (Updated Visuals) --- */
const MiniCard = ({ 
  rank, 
  suit, 
  isExactClash, 
  isRankClash 
}: { 
  rank: string; 
  suit: string; 
  isExactClash: boolean;
  isRankClash: boolean;
}) => {
  const isRed = ["♥", "♦"].includes(suit);
  
  // LOGIC: Exact Clash = Red Pulse
  const bg = isExactClash ? "#330000" : "#e0e0e0"; 
  const border = isExactClash ? "1px solid #ff0000" : "1px solid #fff";
  const textColor = isExactClash ? "#ff3333" : (isRed ? "#d00" : "#111");
  const shadow = isExactClash ? "0 0 15px #ff0000" : "0 2px 4px rgba(0,0,0,0.4)";
  const anim = isExactClash ? "pulseClash 1s infinite" : "none";

  return (
    <div style={{
      width: 36, height: 50,
      background: bg, 
      borderRadius: 3,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: textColor, 
      border: border,
      boxShadow: shadow,
      fontSize: "1rem", fontWeight: "bold", lineHeight: 0.9,
      animation: anim,
      position: "relative"
    }}>
      <span>{rank}</span>
      <span style={{ fontSize: "1rem" }}>{suit}</span>
    </div>
  );
};

/* --- MAIN SCREEN --- */
export const ResultScreen: React.FC<ResultScreenProps> = ({ result, onNextRound }) => {
  if (!result || !result.playerHand || !result.opponentHand) return null;

  const { playerHand, opponentHand, outcome, opponentTargetValue } = result;

  // 1. DATA PREP
  const pCards = playerHand.cards || [];
  const oCards = opponentHand.cards || [];

  // 2. DETECT RANK CLASHES (For the "Clash Detected" text)
  const pRanks = pCards.map(c => c.rank);
  const oRanks = oCards.map(c => c.rank);
  const clashedRanks = pRanks.filter(r => oRanks.includes(r));

  // 3. DETECT EXACT CLASHES (For the Glow)
  const pIds = pCards.map(c => c.id);
  const oIds = oCards.map(c => c.id);
  const exactClashIds = pIds.filter(id => oIds.includes(id));

  const isWin = outcome === "WIN";
  const titleColor = isWin ? "#00ff88" : outcome === "LOSE" ? "#ff4444" : "#ccc";
  const titleText = isWin ? "VICTORY" : outcome === "LOSE" ? "DEFEAT" : "DRAW";

  return (
    <div style={overlayStyle}>
      <style>
        {`
          @keyframes pulseClash {
            0% { box-shadow: 0 0 5px #ff0000; transform: scale(1); }
            50% { box-shadow: 0 0 20px #ff0000; transform: scale(1.1); }
            100% { box-shadow: 0 0 5px #ff0000; transform: scale(1); }
          }
        `}
      </style>

      <div style={panelStyle}>
        
        {/* HEADER */}
        <h1 style={{ ...titleStyle, color: titleColor }}>{titleText}</h1>
        
        <div style={contentContainerStyle}>
          
          {/* --- YOU --- */}
          <div style={sideContainerStyle}>
            <div style={{...labelStyle, color: '#ffd700'}}>YOU</div>
            <div style={handNameStyle}>{playerHand.name}</div>
            
            <div style={cardsRowStyle}>
               {pCards.map((c, i) => (
                  <MiniCard 
                    key={i} 
                    rank={c.rank} 
                    suit={c.suit} 
                    isExactClash={exactClashIds.includes(c.id)} // 🛑 ONLY GLOW IF EXACT
                    isRankClash={clashedRanks.includes(c.rank)} // ⚠️ SUBTLE HINT
                  />
               ))}
            </div>
          </div>

          {/* --- VS --- */}
          <div style={vsContainerStyle}>
             <div style={vsTextStyle}>VS</div>
             {/* Show text if ANY Rank Match happened (explains the burn) */}
             {clashedRanks.length > 0 && (
                 <div style={{fontSize: '0.8rem', color: '#ff3333', marginTop: 10, fontWeight: 'bold', textShadow: '0 0 5px #f00'}}>
                     RANK CLASH
                     {exactClashIds.length > 0 && <div style={{color: '#ffaaaa'}}>EXACT MATCH!</div>}
                 </div>
             )}
          </div>

          {/* --- OPPONENT --- */}
          <div style={{...sideContainerStyle, opacity: 0.9}}>
            <div style={labelStyle}>OPPONENT</div>
            <div style={{...handNameStyle, color: '#aaa'}}>{opponentHand.name}</div>
            
            <div style={cardsRowStyle}>
               {oCards.map((c, i) => (
                  <MiniCard 
                    key={i} 
                    rank={c.rank} 
                    suit={c.suit} 
                    isExactClash={exactClashIds.includes(c.id)} // 🛑 ONLY GLOW IF EXACT
                    isRankClash={clashedRanks.includes(c.rank)} // ⚠️ SUBTLE HINT
                  />
               ))}
            </div>

            <div style={targetUsedStyle}>
               TARGET: <span style={{color: '#fff', fontSize: '1.2rem'}}>{opponentTargetValue ?? 0}</span>
            </div>
          </div>

        </div>

        <button onClick={onNextRound} style={btnStyle}>
          NEXT ROUND
        </button>

      </div>
    </div>
  );
};

/* --- STYLES --- */
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.9)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, pointerEvents: "auto"
};
const panelStyle: React.CSSProperties = {
  width: "90%", maxWidth: "1000px", background: "linear-gradient(180deg, #111 0%, #050505 100%)",
  border: "1px solid #444", borderRadius: 16, padding: "30px 40px", textAlign: "center",
  boxShadow: "0 0 80px rgba(0,0,0,0.8)"
};
const titleStyle: React.CSSProperties = {
  margin: "0 0 30px 0", fontSize: "3rem", fontWeight: "900", letterSpacing: 6,
  textTransform: "uppercase", textShadow: "0 0 30px rgba(0,0,0,0.5)"
};
const contentContainerStyle: React.CSSProperties = {
  display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  gap: 20, marginBottom: 40
};
const sideContainerStyle: React.CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
  background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12
};
const vsContainerStyle: React.CSSProperties = {
  width: 100, display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", alignSelf: "center"
};
const vsTextStyle: React.CSSProperties = {
  fontSize: "2rem", fontWeight: "bold", color: "#444", fontStyle: "italic"
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.9rem", letterSpacing: 2, color: "#888", marginBottom: 10, fontWeight: "bold"
};
const handNameStyle: React.CSSProperties = {
  fontSize: "1.4rem", fontWeight: "bold", color: "#fff", marginBottom: 15, height: "3rem",
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace"
};
const cardsRowStyle: React.CSSProperties = {
  display: "flex", gap: 6, justifyContent: "center", minHeight: 52
};
const targetUsedStyle: React.CSSProperties = {
  marginTop: 20, fontSize: "0.9rem", color: "#666", 
  background: "#000", padding: "5px 15px", borderRadius: 20, border: "1px solid #333"
};
const btnStyle: React.CSSProperties = {
  padding: "15px 50px", background: "#ffd700", color: "#000",
  border: "none", borderRadius: 8, fontSize: "1.2rem", fontWeight: "bold",
  cursor: "pointer", boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)", transition: "all 0.2s"
};
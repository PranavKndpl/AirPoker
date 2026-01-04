import React from "react";
import type { PlayingCard } from "../../../../shared/types";

/* ---------------- TYPES ---------------- */
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
  result: RoundResult | null;
  onNextRound: () => void;
}

/* ---------------- MINI CARD COMPONENT ---------------- */
const MiniCard = ({ rank, suit }: { rank: string; suit: string }) => {
  const isRed = ["♥", "♦"].includes(suit);
  return (
    <div
      style={{
        width: 36,
        height: 50,
        background: "#e0e0e0",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: isRed ? "#d00" : "#111",
        border: "1px solid #fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
        fontSize: "1rem",
        fontWeight: "bold",
        lineHeight: 0.9
      }}
    >
      <span>{rank}</span>
      <span style={{ fontSize: "1rem" }}>{suit}</span>
    </div>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onNextRound
}) => {
  // 1. Only guard on result existence
  if (!result) return null;

  const { playerHand, opponentHand, outcome, opponentTargetValue } = result;

  /* -------------------------------------------------- */
  /* ---------------- TIMEOUT / VOID ------------------ */
  /* -------------------------------------------------- */
  // If hands are missing, the round timed out or no one played
  if (!playerHand || !opponentHand) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <h1 style={{ ...titleStyle, color: "#888" }}>ROUND VOID</h1>

          <p
            style={{
              color: "#ccc",
              fontSize: "1.2rem",
              marginBottom: 30,
              textAlign: "center"
            }}
          >
            Time ran out. No hands were submitted.
          </p>

          <button onClick={onNextRound} style={btnStyle}>
            NEXT ROUND
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------- */
  /* ---------------- NORMAL RESULT ------------------- */
  /* -------------------------------------------------- */
  const isWin = outcome === "WIN";
  const titleColor =
    outcome === "WIN" ? "#00ff88" : outcome === "LOSE" ? "#ff4444" : "#ccc";
  const titleText =
    outcome === "WIN" ? "VICTORY" : outcome === "LOSE" ? "DEFEAT" : "DRAW";

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* HEADER */}
        <h1 style={{ ...titleStyle, color: titleColor }}>{titleText}</h1>

        {/* CONTENT */}
        <div style={contentContainerStyle}>
          {/* --- LEFT: YOUR HAND --- */}
          <div style={sideContainerStyle}>
            <div style={{ ...labelStyle, color: "#ffd700" }}>YOU</div>
            <div style={handNameStyle}>{playerHand.name}</div>

            <div style={cardsRowStyle}>
              {playerHand.cards?.map((c, i) => (
                <MiniCard key={i} rank={c.rank} suit={c.suit} />
              ))}
            </div>
          </div>

          {/* --- CENTER: VS --- */}
          <div style={vsContainerStyle}>
            <div style={vsTextStyle}>VS</div>
          </div>

          {/* --- RIGHT: OPPONENT --- */}
          <div style={{ ...sideContainerStyle, opacity: 0.8 }}>
            <div style={labelStyle}>OPPONENT</div>
            <div style={{ ...handNameStyle, color: "#aaa" }}>
              {opponentHand.name}
            </div>

            <div style={cardsRowStyle}>
              {opponentHand.cards?.map((c, i) => (
                <MiniCard key={i} rank={c.rank} suit={c.suit} />
              )) || <span style={{ color: "#555" }}>???</span>}
            </div>

            <div style={targetUsedStyle}>
              TARGET:{" "}
              <span style={{ color: "#fff", fontSize: "1.2rem" }}>
                {opponentTargetValue ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <button onClick={onNextRound} style={btnStyle}>
          NEXT ROUND
        </button>
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0,
  background: "rgba(0, 0, 0, 0.9)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10000, pointerEvents: "auto"
};

const panelStyle: React.CSSProperties = {
  width: "90%", maxWidth: "1000px", // WIDE
  background: "linear-gradient(180deg, #111 0%, #050505 100%)",
  border: "1px solid #444", borderRadius: 16,
  padding: "30px 40px",
  textAlign: "center",
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
  width: 60, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center"
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
  cursor: "pointer", boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)",
  transition: "all 0.2s"
};
import React from "react";

interface HandInfo {
  name: string;
  strength: number;
}

interface RoundResult {
  outcome: "WIN" | "LOSE" | "DRAW";
  playerHand?: HandInfo;
  opponentHand?: HandInfo;
  opponentTargets?: Record<string, number>;
}

interface ResultScreenProps {
  result: RoundResult;
  onNextRound: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onNextRound
}) => {
  // 🔒 HARD GUARDS (THIS PREVENTS BLANK SCREENS)
  if (!result) return null;

  const { playerHand, opponentHand } = result;

  if (!playerHand || !opponentHand) {
    console.warn("[ResultScreen] Invalid roundResult:", result);

    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <h2 style={{ color: "#ff4444" }}>RESULT ERROR</h2>
          <p>Round resolved but hand data is missing.</p>
          <button onClick={onNextRound} style={btnStyle}>
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  const opponentTargetValue = result.opponentTargets
    ? Object.values(result.opponentTargets)[0] ?? 0
    : 0;

  const outcomeText =
    result.outcome === "WIN"
      ? "YOU WIN"
      : result.outcome === "LOSE"
      ? "YOU LOSE"
      : "DRAW";

  const outcomeColor =
    result.outcome === "WIN"
      ? "#00ff88"
      : result.outcome === "LOSE"
      ? "#ff4444"
      : "#cccccc";

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <h1 style={{ ...titleStyle, color: outcomeColor }}>
          {outcomeText}
        </h1>

        <div style={sectionStyle}>
          <h3>Your Hand</h3>
          <p>
            {playerHand.name} 
          </p>
        </div>

        <div style={sectionStyle}>
          <h3>Opponent Hand</h3>
          <p>
            {opponentHand.name} ({opponentHand.strength})
          </p>
          <p>Number Card: {opponentTargetValue}</p>
        </div>

        <button onClick={onNextRound} style={btnStyle}>
          NEXT ROUND
        </button>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  pointerEvents: "auto"
};

const panelStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#ffd700",
  padding: "40px 60px",
  border: "2px solid #ffd700",
  background: "#000",
  minWidth: 400
};

const titleStyle: React.CSSProperties = {
  marginBottom: 30,
  fontSize: "3rem"
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 25,
  fontSize: "1.2rem"
};

const btnStyle: React.CSSProperties = {
  padding: "15px 30px",
  background: "#ffd700",
  border: "none",
  fontSize: "1.5rem",
  fontWeight: "bold",
  cursor: "pointer"
};

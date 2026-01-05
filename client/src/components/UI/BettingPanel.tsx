// client/src/components/UI/BettingPanel.tsx
import React, { useState } from "react";

interface Props {
  currentBios: number;
  onPlaceBet: (amount: number) => void;
  onToggleView: () => void; // <--- New Prop
}

export const BettingPanel: React.FC<Props> = ({
  currentBios,
  onPlaceBet,
  onToggleView
}) => {
  const [bet, setBet] = useState(0);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        pointerEvents: "auto"
      }}
    >
      {/* THE BOX */}
      <div
        style={{
          pointerEvents: "auto",
          background: "#111",
          border: "1px solid #ffd700",
          borderRadius: 12,
          padding: 40,
          width: 400,
          textAlign: "center",
          boxShadow: "0 0 50px rgba(255, 215, 0, 0.2)",
          position: "relative" // For absolute positioning of close button
        }}
      >
        {/* CLOSE / VIEW TABLE BUTTON */}
        <button
          onClick={onToggleView}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "transparent",
            border: "1px solid #444",
            color: "#888",
            borderRadius: "50%",
            width: 30,
            height: 30,
            cursor: "pointer",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="View Table"
        >
          👁️
        </button>

        <h2
          style={{
            color: "#ffd700",
            fontSize: "2rem",
            marginBottom: 30,
            textTransform: "uppercase"
          }}
        >
          Wager Air
        </h2>

        <div
          style={{
            fontSize: "4rem",
            color: "white",
            fontWeight: "bold",
            fontFamily: "monospace"
          }}
        >
          {bet}
        </div>
        <div style={{ color: "#666", marginBottom: 30 }}>BIOS</div>

        <input
          type="range"
          min="0"
          max={currentBios}
          value={bet}
          onChange={e => setBet(parseInt(e.target.value))}
          style={{
            width: "100%",
            marginBottom: 30,
            accentColor: "#ffd700"
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 30
          }}
        >
          <button
            onClick={() => setBet(0)}
            style={{
              background: "#333",
              border: "none",
              color: "#888",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Check (0)
          </button>
          <button
            onClick={() => setBet(Math.floor(currentBios / 2))}
            style={{
              background: "#333",
              border: "none",
              color: "#888",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Half
          </button>
          <button
            onClick={() => setBet(currentBios)}
            style={{
              background: "#500",
              border: "none",
              color: "#faa",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            ALL IN
          </button>
        </div>

        <button
          onClick={() => onPlaceBet(bet)}
          style={{
            width: "100%",
            padding: 15,
            background: bet >= currentBios ? "#ff4444" : "#ffd700", // Turn RED if All-in
            color: bet >= currentBios ? "#fff" : "#000",
            border: "none",
            borderRadius: 6,
            fontSize: "1.2rem",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {bet >= currentBios ? "ALL IN (RISK DEATH)" : "CONFIRM WAGER"}
        </button>
      </div>
    </div>
  );
};

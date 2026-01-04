// client/src/components/UI/GameOverlays.tsx
import React from "react";
import { socket } from "../../network/socketBridge";
import { LocalStep } from "../../game/localSteps";
import { ResultScreen } from "./ResultScreen";
import { GameOverScreen } from "./GameOverScreen"; // ✅ The Update

interface OverlayProps {
  state: any;   // Pass the full state or specific parts
  actions: any; // Pass actions
}

export const GameOverlays: React.FC<OverlayProps> = ({ state, actions }) => {
  
  // 1. GAME OVER (High Priority)
  if (state.phase === "GAME_OVER" && state.gameOver) {
    return (
      <GameOverScreen
        winnerId={state.gameOver.winner}
        myId={socket.id || ""}
        reason={state.gameOver.reason}
        finalBios={state.gameOver.finalBios}
      />
    );
  }

  // 2. RESULT SCREEN
  if (state.phase === "RESOLUTION" && state.roundResult) {
    return (
      <ResultScreen
        result={state.roundResult}
        onNextRound={actions.requestNextRound}
      />
    );
  }

  // 3. LOBBY
  if (state.phase === "LOBBY" && !state.roomId) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <h1 style={{color: '#ffd700', marginBottom: 20}}>AIR POKER</h1>
          <button onClick={actions.createRoom} style={btnStyle}>
            CREATE ROOM
          </button>
          <button
            onClick={() => {
              const id = prompt("Room ID");
              if (id) actions.joinRoom(id);
            }}
            style={{ ...btnStyle, marginLeft: 20 }}
          >
            JOIN ROOM
          </button>
        </div>
      </div>
    );
  }

  // 4. WAITING FOR OPPONENT
  if (state.localStep === LocalStep.WAITING) {
    return (
      <div style={overlayStyle}>
        <h2 style={{ color: "#ffd700", animation: "pulse 1s infinite" }}>
          Waiting for opponent...
        </h2>
      </div>
    );
  }

  return null;
};

// --- Styles moved here for encapsulation ---
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, pointerEvents: "auto"
};
const panelStyle: React.CSSProperties = {
    textAlign: 'center'
}
const btnStyle: React.CSSProperties = {
  padding: "15px 30px", background: "#ffd700", border: "none",
  fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer"
};
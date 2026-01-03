import React from "react";
import type { GamePhase } from "../../../../shared/types";

interface GameHUDProps {
  roomId: string | null;
  timer: number;
  pot: number;
  bios: number;
  opponentBios: number;
  phase: GamePhase;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  roomId,
  timer,
  pot,
  bios,
  opponentBios,
  phase,
}) => {
  return (
    <>
      {/* TOP-LEFT: TITLE + ROOM + TIMER */}
      <div style={topLeft}>
        <div style={title}>AIR POKER</div>

        {roomId && (
          <div style={room}>
            ROOM: <span style={{ color: "#ffd700" }}>{roomId}</span>
          </div>
        )}

        {phase !== "LOBBY" && (
          <div style={timerStyle(timer)}>
            ⏳ {timer}s
          </div>
        )}

        {phase === "LOBBY" && roomId && (
          <div style={waiting}>Waiting for opponent…</div>
        )}
      </div>

      {/* TOP-RIGHT: POT + BIOS */}
      {phase !== "LOBBY" && (
        <div style={topRight}>
          <div style={potStyle}>POT: {pot}</div>
          <div style={biosStyle}>YOU: {bios} BIOS</div>
          <div style={opponentBiosStyle}>OPP: {opponentBios} BIOS</div>
        </div>
      )}
    </>
  );
};

/* ---------------- styles ---------------- */

const topLeft: React.CSSProperties = {
  position: "absolute",
  top: 24,
  left: 24,
  zIndex: 20,
  pointerEvents: "none",
};

const title: React.CSSProperties = {
  fontSize: "3rem",
  fontWeight: "bold",
  color: "#ffd700",
  letterSpacing: 2,
};

const room: React.CSSProperties = {
  marginTop: 4,
  fontSize: "0.9rem",
  color: "#888",
};

const waiting: React.CSSProperties = {
  marginTop: 12,
  fontSize: "1.1rem",
  color: "#aaa",
  animation: "pulse 1.5s infinite",
};

const timerStyle = (t: number): React.CSSProperties => ({
  marginTop: 12,
  fontSize: "2rem",
  fontWeight: "bold",
  color: t <= 10 ? "#ff3333" : "#ffffff",
});

const topRight: React.CSSProperties = {
  position: "absolute",
  top: 24,
  right: 24,
  zIndex: 20,
  textAlign: "right",
  pointerEvents: "none",
};

const potStyle: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: "bold",
  color: "#ffd700",
  textShadow: "0 0 10px rgba(255,215,0,0.6)",
};

const biosStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: "1.1rem",
  color: "#ffffff",
};

const opponentBiosStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  color: "#888",
};

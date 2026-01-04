// client/src/App.tsx
import React from "react";
import { useGameState } from "./game/useGameState";
import { useGameActions } from "./game/useGameActions";
import { LocalStep } from "./game/localSteps";

import { GameScene } from "./components/Scene/GameScene";
import { BettingPanel } from "./components/UI/BettingPanel";
import { SelectionGrid } from "./components/UI/SelectionGrid";
import { GameHUD } from "./components/UI/GameHUD";

export default function App() {
  const {
    state,
    setLocalStep,
    setSelectedTargetId,
    setSelectedCardIds,
    openTableView,
    closeTableView
  } = useGameState();

  const actions = useGameActions({
    localStep: state.localStep,
    overlay: state.overlay,
    openTableView,
    closeTableView,
    setLocalStep,
    selectedTargetId: state.selectedTargetId,
    setSelectedTargetId,
    selectedCardIds: state.selectedCardIds,
    setSelectedCardIds
  });

  // Compute opponent target value
  const opponentTargetValue =
    state.roundResult?.opponentTargets
      ? Object.values(state.roundResult.opponentTargets)[0] ?? 0
      : 0;

  return (
    <div style={rootStyle}>
      {/* ================= UI OVERLAY LAYER ================= */}
      <div style={overlayRootStyle}>
        {/* LOBBY */}
        {state.phase === "LOBBY" && !state.roomId && (
          <Overlay>
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
          </Overlay>
        )}

        {/* VIEW TABLE */}
        {state.overlay === "VIEW_TABLE" && (
          <div
            style={{
              position: "fixed",
              bottom: 30,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              zIndex: 100,
              pointerEvents: "none"
            }}
          >
            <button
              onClick={actions.toggleViewTable}
              style={{
                ...btnStyle,
                pointerEvents: "auto"
              }}
            >
              RETURN TO GAME
            </button>
          </div>
        )}

        {/* WAITING */}
        {state.localStep === LocalStep.WAITING && (
          <Overlay>
            <h2 style={{ color: "#ffd700" }}>
              Waiting for opponent...
            </h2>
          </Overlay>
        )}

        {/* RESOLUTION */}
        {state.phase === "RESOLUTION" && (
          <Overlay>
            <button onClick={actions.requestNextRound} style={btnStyle}>
              NEXT ROUND
            </button>
          </Overlay>
        )}

        {/* GAME OVER */}
        {state.phase === "GAME_OVER" && (
          <Overlay>
            <h1 style={{ color: "#ffd700" }}>GAME OVER</h1>
          </Overlay>
        )}
      </div>

      {/* ================= 3D SCENE ================= */}
      <GameScene
        phase={state.phase}
        myNumberHand={state.myNumberHand}
        selectedTargetId={state.selectedTargetId}
        selectedCardIds={state.selectedCardIds}
        globalDeck={state.globalDeck}
        targetValue={state.targetValue}
        opponentTargetValue={0}
        bios={state.bios}
        opponentBios={state.opponentBios}
        onTargetClick={(id) => actions.lockTarget(id)}
      />

      {/* ================= HUD ================= */}
      <GameHUD
        roomId={state.roomId}
        timer={state.timer}
        pot={state.pot}
        bios={state.bios}
        opponentBios={state.opponentBios}
        phase={state.phase}
      />

      {/* ================= IN-GAME PANELS ================= */}
      {state.phase === "GAME_LOOP" &&
        state.localStep === LocalStep.BETTING &&
        state.overlay === "NONE" && (
          <BettingPanel
            currentBios={state.bios}
            onPlaceBet={actions.placeBet}
            onToggleView={actions.toggleViewTable}
          />
        )}

      {state.phase === "GAME_LOOP" &&
        state.localStep === LocalStep.PICK_HAND &&
        state.overlay === "NONE" && (
          <SelectionGrid
            deck={state.globalDeck}
            selectedIds={state.selectedCardIds}
            onToggle={actions.toggleCard}
            onConfirm={actions.submitHand}
            onClose={actions.toggleViewTable}
            currentSum={state.currentSum}
            targetValue={state.targetValue}
          />
        )}
    </div>
  );
}

/* ================= REUSABLE OVERLAY ================= */
function Overlay({ children }: { children: React.ReactNode }) {
  return <div style={overlayStyle}>{children}</div>;
}

/* ================= STYLES ================= */
const rootStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  background: "#000",
  overflow: "hidden"
};

const overlayRootStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  pointerEvents: "none"
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "auto"
};

const btnStyle: React.CSSProperties = {
  padding: "15px 30px",
  background: "#ffd700",
  border: "none",
  fontSize: "1.5rem",
  fontWeight: "bold",
  cursor: "pointer"
};

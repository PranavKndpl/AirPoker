// client/src/App.tsx
import React from "react";
import { useGameState } from "./game/useGameState";
import { useGameActions } from "./game/useGameActions";

// Components
import { GameScene } from "./components/Scene/GameScene";
import { GameHUD } from "./components/UI/GameHUD";
import { GameOverlays } from "./components/UI/GameOverlays";
import { ActiveTurnPanel } from "./components/UI/ActiveTurnPanel";

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

  return (
    <div style={rootStyle}>
      
      {/* 1. GLOBAL OVERLAYS (Lobby, Results, Game Over, Waiting) */}
      {/* This now handles the "True Winner" screen automatically via state.gameOver */}
      <GameOverlays state={state} actions={actions} />

      {/* 2. 3D GAME WORLD */}
      <GameScene
        phase={state.phase}
        localStep={state.localStep}
        
        myNumberHand={state.myNumberHand}
        selectedTargetId={state.selectedTargetId}
        selectedCardIds={state.selectedCardIds}
        globalDeck={state.globalDeck}
        
        targetValue={state.targetValue}
        opponentTargetValue={state.opponentTargetValue} // Now updates dynamically
        
        bios={state.bios}
        opponentBios={state.opponentBios}
        
        onTargetClick={(id) => actions.selectTarget(id)}
        opponentLocked={state.opponentLocked}
      />

      {/* 3. HEADS UP DISPLAY (Updated with Match Scores) */}
      <GameHUD
        roomId={state.roomId}
        timer={state.timer}
        pot={state.pot}
        bios={state.bios}
        opponentBios={state.opponentBios}
        phase={state.phase}
        
        // 🏆 NEW: Pass Match Score to HUD
        myWins={state.myWins} 
        opponentWins={state.opponentWins}
      />

      {/* 4. ACTIVE TURN UI (Betting / Hand Selection) */}
      <ActiveTurnPanel state={state} actions={actions} />

      {/* 5. VIEW TABLE TOGGLE (Floating Button) */}
      {state.overlay === "VIEW_TABLE" && state.phase === "GAME_LOOP" && (
        <div style={floatingBtnContainer}>
          <button onClick={actions.toggleViewTable} style={returnBtnStyle}>
            RETURN TO GAME
          </button>
        </div>
      )}

    </div>
  );
}

/* ================= STYLES ================= */
const rootStyle: React.CSSProperties = {
  width: "100vw", height: "100vh", background: "#000", overflow: "hidden"
};

const floatingBtnContainer: React.CSSProperties = {
  position: "fixed", bottom: 30, width: "100%", 
  display: "flex", justifyContent: "center", 
  zIndex: 100, pointerEvents: "none"
};

const returnBtnStyle: React.CSSProperties = {
  padding: "15px 30px", background: "#ffd700", border: "none",
  fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer",
  pointerEvents: "auto", borderRadius: 8, boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
};
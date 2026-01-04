import React, { useState } from "react";
import { LocalStep } from "../../game/localSteps";
import { BettingPanel } from "./BettingPanel";
import { SelectionGrid } from "./SelectionGrid";

interface TurnPanelProps {
  state: any;
  actions: any;
}

export const ActiveTurnPanel: React.FC<TurnPanelProps> = ({ state, actions }) => {
  if (state.overlay !== "NONE") return null;
  const [showGrid, setShowGrid] = useState(false);

  // 1. TARGET SELECTION PHASE
  if (state.localStep === LocalStep.PICK_TARGET) {
    if (!state.selectedTargetId) {
      // Prompt user to pick
      return (
        <div style={hintStyle}>
          Select a Target Number
        </div>
      );
    }
    // Show Confirm Button
    return (
      <div style={bottomCenterStyle}>
        <div style={{ marginBottom: 10, color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold' }}>
           TARGET: {state.myNumberHand.find((c: any) => c.id === state.selectedTargetId)?.value}
        </div>
        <button onClick={actions.confirmTarget} style={mainBtnStyle}>
          LOCK IN TARGET
        </button>
      </div>
    );
  }

  // 2. BETTING PHASE (Unchanged)
  if (state.localStep === LocalStep.BETTING) {
    return (
      <BettingPanel
        currentBios={state.bios}
        onPlaceBet={actions.placeBet}
        onToggleView={actions.toggleViewTable}
      />
    );
  }

  // 3. HAND SELECTION PHASE (New "Open" Step)
  if (state.localStep === LocalStep.PICK_HAND) {
    // If grid is not open yet, show the "Open" button
    if (!showGrid) {
      return (
        <div style={bottomCenterStyle}>
           <button onClick={() => setShowGrid(true)} style={mainBtnStyle}>
             OPEN HAND SELECTION
           </button>
        </div>
      );
    }

    // If open, show the grid
    return (
      <SelectionGrid
        deck={state.globalDeck}
        selectedIds={state.selectedCardIds}
        onToggle={actions.toggleCard}
        onConfirm={actions.submitHand}
        onClose={() => setShowGrid(false)} // Allow closing to see table
        currentSum={state.currentSum}
        targetValue={state.targetValue}
      />
    );
  }

  return null;
};

/* --- STYLES --- */
const bottomCenterStyle: React.CSSProperties = {
  position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
  textAlign: "center", zIndex: 20, pointerEvents: "auto"
};

const hintStyle: React.CSSProperties = {
  position: "fixed", top: 100, width: "100%", textAlign: "center",
  color: "#fff", fontSize: "1.5rem", textShadow: "0 0 10px #000",
  pointerEvents: "none"
};

const mainBtnStyle: React.CSSProperties = {
  padding: "15px 40px", fontSize: "1.2rem", fontWeight: "bold",
  background: "#ffd700", border: "none", borderRadius: 8,
  cursor: "pointer", boxShadow: "0 0 20px rgba(255,215,0,0.4)"
};
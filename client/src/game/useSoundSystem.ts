import { useEffect, useRef } from "react";
import { Howl } from "howler"; 

const SOUNDS = {
  // We use your "flip" sound for everything right now, 
  // but we will tune the pitch/volume to make them sound different.
  flip: new Howl({ src: ["/sounds/flip.mp3"], volume: 0.6 }),
};

export const useSoundSystem = (state: any) => {
  const prevPhase = useRef(state.phase);
  const prevLocalStep = useRef(state.localStep);
  const prevPot = useRef(state.pot);

  // 1. PHASE CHANGE (REVEAL)
  useEffect(() => {
    if (prevPhase.current !== state.phase) {
      if (state.phase === "RESOLUTION") {
        // REVEAL: Play loud and normal speed
        SOUNDS.flip.rate(1.0);
        SOUNDS.flip.volume(0.8);
        SOUNDS.flip.play();
      }
    }
    prevPhase.current = state.phase;
  }, [state.phase]);

  // 2. BETTING (When Pot Increases)
  useEffect(() => {
    if (state.pot > prevPot.current) {
      // BET: Play quieter and faster (like a chip sliding)
      SOUNDS.flip.rate(1.5); 
      SOUNDS.flip.volume(0.4);
      SOUNDS.flip.play();
    }
    prevPot.current = state.pot;
  }, [state.pot]);

  // 3. LOCKING IN (When you submit a card)
  useEffect(() => {
    if (state.localStep === "WAITING" && prevLocalStep.current !== "WAITING") {
      // LOCK: Play lower pitch (heavier)
      SOUNDS.flip.rate(0.8);
      SOUNDS.flip.volume(1);
      SOUNDS.flip.play();
    }
    prevLocalStep.current = state.localStep;
  }, [state.localStep]);

  return { 
    playSound: () => SOUNDS.flip.play() 
  };
};
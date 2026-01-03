import { useState, useEffect, useMemo } from 'react';
import { socket } from '../socket';
// FIX 1: Use 'import type' to satisfy verbatimModuleSyntax
import type { GamePhase, PlayingCard, NumberCard } from '../../../shared/types'; 

// Local UI Steps (These stay Client-Only)
export type LocalStep = 'PICK_TARGET' | 'BETTING' | 'PICK_HAND' | 'WAITING_FOR_OPPONENT' | 'VIEW_TABLE';

export const useGameLogic = () => {
  // FIX 2: Use the imported GamePhase type
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [localStep, setLocalStep] = useState<LocalStep>('PICK_TARGET');
  
  // We need to remember where to go back to when "Viewing Table"
  const [lastStep, setLastStep] = useState<LocalStep>('PICK_TARGET'); 
  
  const [timer, setTimer] = useState(60);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Game Data
  const [globalDeck, setGlobalDeck] = useState<PlayingCard[]>([]);
  const [myNumberHand, setMyNumberHand] = useState<NumberCard[]>([]);
  const [bios, setBios] = useState(25);
  const [opponentBios, setOpponentBios] = useState(25);
  const [pot, setPot] = useState(0);

  // Selection
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  
  const [opponentStatus, setOpponentStatus] = useState({
      targetLocked: false,
      betPlaced: false,
      handSubmitted: false
  });
  
  const [roundResult, setRoundResult] = useState<any>(null);
  const [gameOver, setGameOver] = useState<any>(null);

  // --- LISTENERS ---
  useEffect(() => {
     socket.on("room_created", ({ roomId }) => setRoomId(roomId));

     socket.on("new_round_start", (data) => {
        setGlobalDeck(data.globalDeck);
        setMyNumberHand(data.numberHand);
        setBios(data.bios);
        setOpponentBios(data.opponentBios);
        setPot(data.pot);
        
        // FIX 3: Use 'GAME_LOOP' instead of 'ACTIVE'
        setPhase('GAME_LOOP'); 
        setLocalStep('PICK_TARGET');
        setOpponentStatus({ targetLocked: false, betPlaced: false, handSubmitted: false });
        setTimer(data.timeRemaining);
        
        setSelectedTargetId(null);
        setSelectedCardIds([]);
        setRoundResult(null);
     });

     socket.on("opponent_action", (action) => {
        if(action.type === "TARGET_LOCKED") setOpponentStatus(p => ({ ...p, targetLocked: true }));
        if(action.type === "BET_PLACED") setOpponentStatus(p => ({ ...p, betPlaced: true }));
        if(action.type === "HAND_SUBMITTED") setOpponentStatus(p => ({ ...p, handSubmitted: true }));
     });

     socket.on("economy_update", (data) => {
        setPot(data.pot);
        if (socket.id && data.bios[socket.id]) setBios(data.bios[socket.id]);
        else {
            const opId = Object.keys(data.bios).find(k => k !== socket.id);
            if(opId) setOpponentBios(data.bios[opId]);
        }
     });

     socket.on("timer_sync", (time) => setTimer(time));

     socket.on("round_result", (data) => {
        setPhase('RESOLUTION');
        setRoundResult(data.result);
        if (socket.id && data.updatedBios[socket.id]) {
            setBios(data.updatedBios[socket.id]);
            const opId = Object.keys(data.updatedBios).find(k => k !== socket.id);
            if(opId) setOpponentBios(data.updatedBios[opId]);
        }
        setGlobalDeck(data.updatedDeck);
        if(data.gameOver) {
            setGameOver(data.gameOver);
            setPhase('GAME_OVER');
        }
     });
     
     return () => { socket.removeAllListeners(); };
  }, []);
  
  // Timer
  useEffect(() => {
     // FIX 4: Check for 'GAME_LOOP'
     if(phase === 'GAME_LOOP' && timer > 0) {
        const i = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(i);
     }
  }, [phase, timer]);

  // --- HELPER ---
  const opponentRevealedValue = useMemo(() => {
      if (!roundResult || !roundResult.opponentTargets) return 0;
      const ids = Object.keys(roundResult.opponentTargets);
      const opId = ids.find(id => id !== socket.id);
      return opId ? roundResult.opponentTargets[opId] : 0;
  }, [roundResult]);

  // --- ACTIONS ---
  const actions = {
     createRoom: () => { socket.connect(); socket.emit("create_room", "Player 1"); },
     joinRoom: (id: string) => { socket.connect(); socket.emit("join_room", { roomId: id, name: "Player 2" }); },

     lockTarget: (id: string) => {
        setSelectedTargetId(id);
        setLocalStep('BETTING'); 
        socket.emit("action_target", { targetId: id });
     },
     
     placeBet: (amount: number) => {
        setBios(prev => prev - amount); 
        setPot(prev => prev + amount);
        setLocalStep('PICK_HAND'); 
        socket.emit("action_bet", { amount });
     },

     toggleCard: (id: string) => {
        if (selectedCardIds.includes(id)) setSelectedCardIds(prev => prev.filter(c => c !== id));
        else if (selectedCardIds.length < 5) setSelectedCardIds(prev => [...prev, id]);
     },
     
     toggleView: () => {
         if (localStep === 'VIEW_TABLE') {
             setLocalStep(lastStep);
         } else {
             setLastStep(localStep);
             setLocalStep('VIEW_TABLE');
         }
     },
     
     submitHand: () => {
         setLocalStep('WAITING_FOR_OPPONENT');
         socket.emit("action_submit", { cardIds: selectedCardIds });
     },
     
     closeGrid: () => alert("Cannot close grid during selection."),
     nextRound: () => socket.emit("next_round_request"),
     leaveRoom: () => window.location.reload()
  };

  const targetVal = myNumberHand.find(n => n.id === selectedTargetId)?.value || 0;
  const currentSum = selectedCardIds.reduce((sum, id) => {
    const c = globalDeck.find(x => x.id === id);
    return sum + (c ? c.value : 0);
  }, 0);

  return { 
     state: { 
        phase, localStep, timer, opponentStatus, 
        gameState: phase, roomId, globalDeck, myNumberHand, 
        bios, opponentBios, pot, selectedTargetId, selectedCardIds,
        roundResult, gameOver, targetVal, currentSum,
        opponentRevealedValue 
     }, 
     actions 
  };
};
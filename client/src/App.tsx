import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';

// --- COMPONENTS ---
import { Atmosphere } from './components/Scene/Atmosphere';
import { Table3D } from './components/Game/Table3D';
import { BioChipsStack } from './components/Game/BioChipsSprite'; 
import { Card3D } from './components/Game/Card3D';
import { NumberCard3D } from './components/Game/NumberCard3D';
import { TargetSlot } from './components/Game/TargetSlot';
import { SelectionGrid } from './components/UI/SelectionGrid';
import { BettingPanel } from './components/UI/BettingPanel';
import { socket } from './socket';

// --- TYPES ---
type PlayingCard = { id: string; suit: string; rank: string; value: number; usedBy: string | null };
type NumberCard = { id: string; value: number; isUsed: boolean };
type GameState = 'LOBBY' | 'WAITING' | 'SELECTION_TARGET' | 'BETTING' | 'SELECTION_GRID' | 'RESOLUTION';

const Loader = () => <Html center><div className="text-yellow-500 font-mono animate-pulse">LOADING...</div></Html>;

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Game Data
  const [globalDeck, setGlobalDeck] = useState<PlayingCard[]>([]);
  const [myNumberHand, setMyNumberHand] = useState<NumberCard[]>([]);
  const [bios, setBios] = useState(25);
  const [opponentBios, setOpponentBios] = useState(25);
  const [pot, setPot] = useState(0);

  // Player Actions
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [opponentLocked, setOpponentLocked] = useState(false); // Visual: Opponent picked target
  
  // Resolution
  const [roundResult, setRoundResult] = useState<any>(null);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    // 1. Setup & Start
    socket.on("room_created", ({ roomId }) => { 
      setRoomId(roomId); 
      setGameState('WAITING'); 
    });

    socket.on("game_started", (data) => {
      setGlobalDeck(data.globalDeck);
      setMyNumberHand(data.numberHand);
      setBios(data.bios);
      setOpponentBios(data.opponentBios);
      setPot(data.pot);
      setGameState('SELECTION_TARGET');
      setOpponentLocked(false);
    });

    // 2. Phase Transitions
    socket.on("opponent_locked_target", () => {
      setOpponentLocked(true); // Shows face-down card in opponent slot
    });

    socket.on("phase_change", ({ phase }) => {
      // Server authorizes moving to 'BETTING' or 'SELECTION_GRID'
      setGameState(phase as GameState); 
    });

    socket.on("update_economy", (data) => {
      setBios(data.bios);
      setOpponentBios(data.opponentBios);
      setPot(data.pot);
    });

    // 3. Resolution & Loop
    socket.on("round_result", (data) => {
      setRoundResult(data.result);
      setGlobalDeck(data.updatedDeck);
      setGameState('RESOLUTION');
    });

    socket.on("new_round", (data) => {
      // Reset for next round
      setPot(data.pot);
      setBios(data.biosMap[socket.id]); // Update my bios (ante paid)
      // Reset local selection state
      setSelectedTargetId(null);
      setSelectedCardIds([]);
      setOpponentLocked(false);
      setRoundResult(null);
      setGameState('SELECTION_TARGET');
    });

    return () => { socket.removeAllListeners(); };
  }, []);


  // --- HANDLERS ---
  
  const handleCreateRoom = () => {
    socket.connect();
    socket.emit("create_room", "Player 1");
  };

  const handleJoinRoom = () => {
    const id = prompt("Enter Room ID:");
    if (id) {
      socket.connect();
      socket.emit("join_room", { roomId: id, name: "Player 2" });
    }
  };

  // Phase 1: Lock Target
  const handleTargetClick = (id: string) => {
    if (gameState !== 'SELECTION_TARGET') return;
    setSelectedTargetId(id);
    socket.emit("lock_target", { targetId: id });
    // Note: We stay in 'SELECTION_TARGET' until server sends 'phase_change' -> 'BETTING'
  };

  // Phase 2: Betting
  const handlePlaceBet = (amount: number) => {
    socket.emit("place_bet", { amount });
    // UI will wait for 'phase_change' -> 'SELECTION_GRID'
  };

  // Phase 3: Grid Selection
  const handleGridToggle = (id: string) => {
    if (selectedCardIds.includes(id)) setSelectedCardIds(prev => prev.filter(c => c !== id));
    else if (selectedCardIds.length < 5) setSelectedCardIds(prev => [...prev, id]);
  };

  const handleGridSubmit = () => {
    socket.emit("submit_turn", { targetId: selectedTargetId, cardIds: selectedCardIds });
    // Wait for resolution...
  };

  const handleCloseGrid = () => {
    // "Back" button logic - resets target selection locally
    // (Only works if server hasn't locked us in, but phase check handles that)
    // Actually, once in 'SELECTION_GRID', the server expects a hand. 
    // Going back is visual only unless we implement 'unlock' logic. 
    // For now, let's keep it strict: Once you bet, you MUST pick cards.
    alert("Bets are placed. You must finish the hand.");
  };

  const handleNextRound = () => {
    socket.emit("next_round_confirm");
  };

  // Helpers
  const targetVal = myNumberHand.find(n => n.id === selectedTargetId)?.value || 0;
  const currentSum = selectedCardIds.reduce((sum, id) => {
    const c = globalDeck.find(x => x.id === id);
    return sum + (c ? c.value : 0);
  }, 0);


  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      
      {/* --- 3D WORLD --- */}
      <Canvas shadows style={{ position: 'absolute', inset: 0 }}>
        <PerspectiveCamera makeDefault position={[0, 18, 12]} fov={35} />
        <ambientLight intensity={0.4} />
        
        <Suspense fallback={<Loader />}>
          <Environment preset="city" blur={1} />
          <Atmosphere />
          <Table3D />
          
          <EffectComposer enableNormalPass>
            <Bloom luminanceThreshold={1} intensity={1.5} radius={0.5} />
            <Vignette darkness={1.0} />
            <Noise opacity={0.05} />
          </EffectComposer>

          {/* TABLE SLOTS */}
          <TargetSlot position={[0, 0.55, 2]} label="YOUR TARGET" />
          <TargetSlot position={[0, 0.55, -2]} label="OPPONENT" />

          {/* PLAYER NUMBER CARDS */}
          {myNumberHand.map((card, i) => {
             const isSelected = card.id === selectedTargetId;
             // Move to slot if selected, otherwise row
             const pos: [number, number, number] = isSelected ? [0, 0.60, 2] : [(i - 2) * 1.8, 0.55, 5];
             
             return (
               <NumberCard3D 
                 key={card.id} 
                 value={card.value} 
                 position={pos} 
                 isSelected={isSelected}
                 isUsed={card.isUsed}
                 onClick={() => handleTargetClick(card.id)}
               />
             );
          })}

          {/* OPPONENT CARD (Visual Feedback) */}
          {opponentLocked && (
             <NumberCard3D value={0} position={[0, 0.65, -2]} isUsed={false} />
          )}

          {/* PLAYING CARDS ON TABLE (Visual only) */}
          {selectedCardIds.map((id, i) => {
             const c = globalDeck.find(x => x.id === id);
             if(!c) return null;
             return <Card3D key={id} position={[(i - 2) * 1.5, 0.6, 0]} rank={c.rank} suit={c.suit as any} />;
          })}

          {/* BIO CHIPS (Dynamic Stacks) */}
          <BioChipsStack count={bios} position={[-6, 0.55, 3]} />
          <BioChipsStack count={opponentBios} position={[6, 0.55, -3]} />

        </Suspense>
        <ContactShadows opacity={0.7} scale={40} blur={2} />
        <OrbitControls maxPolarAngle={Math.PI/2.1} minDistance={10} maxDistance={30} />
      </Canvas>


      {/* --- UI OVERLAYS --- */}

      {/* 1. HUD (Always visible in game) */}
      {gameState !== 'LOBBY' && gameState !== 'WAITING' && (
        <div style={{ position: 'absolute', top: 30, right: 30, textAlign: 'right', pointerEvents: 'none', zIndex: 10 }}>
           <div style={{ color: '#ffd700', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px #ffd700' }}>POT: {pot}</div>
           <div style={{ color: 'white', fontSize: '1.2rem', marginTop: 5 }}>YOU: {bios} BIOS</div>
           <div style={{ color: '#888', fontSize: '1rem' }}>OPP: {opponentBios} BIOS</div>
        </div>
      )}

      {/* 2. HEADER */}
      <div style={{ position: 'absolute', top: 30, left: 30, pointerEvents: 'none', zIndex: 10 }}>
           <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ffd700', margin: 0 }}>AIR POKER</h1>
           <div style={{ color: '#888' }}>{roomId ? `ROOM: ${roomId}` : ''}</div>
      </div>

      {/* 3. LOBBY */}
      {gameState === 'LOBBY' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}>
             <button onClick={handleCreateRoom} style={btnStyle}>CREATE ROOM</button>
             <button onClick={handleJoinRoom} style={{...btnStyle, background: 'transparent', border:'2px solid #ffd700', color: '#ffd700', marginLeft: 20}}>JOIN ROOM</button>
          </div>
      )}

      {/* 4. WAITING SCREEN */}
      {gameState === 'WAITING' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 20 }}>
             <h2 className="animate-pulse" style={{ fontSize: '2rem', color: '#ffd700', textShadow: '0 0 10px #ffd700' }}>
               WAITING FOR OPPONENT...
             </h2>
          </div>
      )}

      {/* 5. BETTING PANEL */}
      {gameState === 'BETTING' && (
        <BettingPanel currentBios={bios} onPlaceBet={handlePlaceBet} />
      )}

      {/* 6. SELECTION GRID */}
      {gameState === 'SELECTION_GRID' && (
        <SelectionGrid 
          deck={globalDeck}
          selectedIds={selectedCardIds}
          onToggle={handleGridToggle}
          onConfirm={handleGridSubmit}
          onClose={handleCloseGrid}
          currentSum={currentSum}
          targetValue={targetVal}
        />
      )}

      {/* 7. RESOLUTION */}
      {gameState === 'RESOLUTION' && roundResult && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', zIndex: 30 }}>
             <h1 style={{ color: roundResult.type === 'OVERLAP' ? '#ff3333' : (roundResult.winner === socket.id ? '#0f0' : '#f00'), fontSize: '4rem', margin: 0 }}>
               {roundResult.type === 'OVERLAP' ? 'AGONY' : (roundResult.winner === socket.id ? 'VICTORY' : 'DEFEAT')}
             </h1>
             <p style={{ color: 'white', fontSize: '1.5rem', marginTop: 10, fontFamily: 'monospace' }}>
               {roundResult.desc}
             </p>
             <button onClick={handleNextRound} style={{ marginTop: 40, ...btnStyle }}>NEXT ROUND</button>
          </div>
      )}

    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '15px 30px',
  background: '#ffd700',
  border: 'none',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  borderRadius: 4
};
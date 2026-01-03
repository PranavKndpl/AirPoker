import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';

import { Atmosphere } from './components/Scene/Atmosphere';
import { Table3D } from './components/Game/Table3D';
import { BioChipsStack } from './components/Game/BioChipsSprite'; 
import { Card3D } from './components/Game/Card3D';
import { NumberCard3D } from './components/Game/NumberCard3D';
import { TargetSlot } from './components/Game/TargetSlot';
import { SelectionGrid } from './components/UI/SelectionGrid';
import { socket } from './socket';

type PlayingCard = { id: string; suit: string; rank: string; value: number; usedBy: string | null };
type NumberCard = { id: string; value: number; isUsed: boolean };
type GameState = 'LOBBY' | 'WAITING' | 'SELECTION_TARGET' | 'SELECTION_GRID' | 'RESOLUTION';

const Loader = () => <Html center><div className="text-yellow-500 font-mono">LOADING ASSETS...</div></Html>;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [globalDeck, setGlobalDeck] = useState<PlayingCard[]>([]);
  const [myNumberHand, setMyNumberHand] = useState<NumberCard[]>([]);
  
  // Selection
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [roundResult, setRoundResult] = useState<any>(null);

  useEffect(() => {
    socket.on("room_created", (data) => { setRoomId(data.roomId); setGameState('WAITING'); });
    socket.on("game_started", (data) => {
      setGlobalDeck(data.globalDeck);
      setMyNumberHand(data.numberHand);
      setGameState('SELECTION_TARGET');
    });
    socket.on("round_result", (data) => {
      setRoundResult(data.result);
      setGlobalDeck(data.updatedDeck);
      setGameState('RESOLUTION');
    });
    return () => { socket.removeAllListeners(); };
  }, []);

  const handleTargetClick = (id: string) => {
    if (gameState !== 'SELECTION_TARGET') return;
    setSelectedTargetId(id);
    setGameState('SELECTION_GRID');
  };

  const handleGridToggle = (id: string) => {
    if (selectedCardIds.includes(id)) setSelectedCardIds(prev => prev.filter(c => c !== id));
    else if (selectedCardIds.length < 5) setSelectedCardIds(prev => [...prev, id]);
  };

  const handleSubmit = () => {
    socket.emit("submit_turn", { targetId: selectedTargetId, cardIds: selectedCardIds });
    setGameState('WAITING'); // Wait for opponent
  };
  
  const handleNextRound = () => {
     setSelectedCardIds([]);
     setSelectedTargetId(null);
     setGameState('SELECTION_TARGET');
     setRoundResult(null);
  };

  const targetVal = myNumberHand.find(n => n.id === selectedTargetId)?.value || 0;
  const currentSum = selectedCardIds.reduce((sum, id) => {
    const c = globalDeck.find(x => x.id === id);
    return sum + (c ? c.value : 0);
  }, 0);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      
      {/* 1. 3D SCENE */}
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

          {/* SLOTS */}
          <TargetSlot position={[0, 0.55, 2]} label="YOUR TARGET" />
          <TargetSlot position={[0, 0.55, -2]} label="OPPONENT" />

          {/* PLAYER NUMBER CARDS */}
          {myNumberHand.map((card, i) => {
             const isSelected = card.id === selectedTargetId;
             // If selected, it goes to slot. If not, it sits in the "hand" row.
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

          {/* DUMMY OPPONENT CARDS */}
          {[0,1,2,3,4].map(i => <NumberCard3D key={i} value={0} position={[(i - 2) * 1.8, 0.55, -5]} isUsed={false} />)}

          {/* SELECTED PLAYING CARDS ON TABLE */}
          {selectedCardIds.map((id, i) => {
             const c = globalDeck.find(x => x.id === id);
             if(!c) return null;
             return <Card3D key={id} position={[(i - 2) * 1.5, 0.6, 0]} rank={c.rank} suit={c.suit as any} />;
          })}

          {/* CHIPS */}
          <BioChipsStack count={30} position={[-6, 0.55, 3]} />
          <BioChipsStack count={30} position={[6, 0.55, -3]} />

        </Suspense>
        <ContactShadows opacity={0.7} scale={40} blur={2} />
        <OrbitControls maxPolarAngle={Math.PI/2.1} minDistance={10} maxDistance={30} />
      </Canvas>


      {/* 2. UI OVERLAYS */}
      <div style={{ position: 'absolute', top: 30, left: 30, pointerEvents: 'none', zIndex: 10 }}>
           <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ffd700', margin: 0 }}>AIR POKER</h1>
           <div style={{ color: '#888' }}>{roomId ? `ROOM: ${roomId}` : ''}</div>
      </div>

      {/* SELECTION GRID */}
      {gameState === 'SELECTION_GRID' && (
        <SelectionGrid 
          deck={globalDeck}
          selectedIds={selectedCardIds}
          onToggle={handleGridToggle}
          onConfirm={handleSubmit}
          currentSum={currentSum}
          targetValue={targetVal}
        />
      )}

      {/* LOBBY */}
      {gameState === 'LOBBY' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}>
             <button onClick={() => {socket.connect(); socket.emit("create_room", "P1")}} style={{padding: '15px 30px', background: '#ffd700', border:'none', fontSize: '1.5rem', fontWeight:'bold', cursor:'pointer'}}>CREATE ROOM</button>
             <button onClick={() => {const id=prompt("ID"); if(id){socket.connect(); socket.emit("join_room", {roomId:id, name:"P2"})}}} style={{marginLeft: 20, padding: '15px 30px', background: 'transparent', border:'2px solid #ffd700', color: '#ffd700', fontSize: '1.5rem', fontWeight:'bold', cursor:'pointer'}}>JOIN</button>
          </div>
      )}

      {/* WAITING SCREEN (RESTORED!) */}
      {gameState === 'WAITING' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 20 }}>
             <h2 style={{ fontSize: '2rem', color: '#ffd700', textShadow: '0 0 10px #ffd700', animation: 'pulse 2s infinite' }}>
               WAITING FOR OPPONENT...
             </h2>
          </div>
      )}

      {/* RESOLUTION */}
      {gameState === 'RESOLUTION' && roundResult && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', zIndex: 30 }}>
             <h1 style={{ color: roundResult.winner === socket.id ? '#0f0' : '#f00', fontSize: '4rem', margin: 0 }}>
               {roundResult.winner === socket.id ? 'VICTORY' : 'DEFEAT'}
             </h1>
             <p style={{ color: 'white', fontSize: '2rem' }}>{roundResult.desc}</p>
             <button onClick={handleNextRound} style={{ marginTop: 40, padding: '10px 30px', fontSize: '1.5rem', background: '#ffd700', border:'none', cursor:'pointer' }}>NEXT ROUND</button>
          </div>
      )}

    </div>
  );
}
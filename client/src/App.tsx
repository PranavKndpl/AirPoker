import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Atmosphere } from './components/Scene/Atmosphere';
import { Table3D } from './components/Game/Table3D';
import { BioChipsStack } from './components/Game/BioChipsSprite';
import { Card3D } from './components/Game/Card3D';
import { TargetDisplay } from './components/Game/TargetDisplay';
import { socket } from './socket';

// Type for a playing card
type CardData = { rank: string; suit: '♠' | '♥' | '♣' | '♦' };

// Loader component for suspense
const Loader = () => (
  <Html center>
    <div className="text-white font-mono animate-pulse">LOADING...</div>
  </Html>
);

function App() {
  const [gameState, setGameState] = useState<'LOBBY' | 'PLAYING'>('LOBBY');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myHand, setMyHand] = useState<CardData[]>([]);

  // Socket listeners
  useEffect(() => {
    socket.on('room_created', ({ roomId }) => {
      setRoomId(roomId);
      setGameState('PLAYING');
    });

    socket.on('game_started', (data: { myHand: CardData[] }) => {
      setMyHand(data.myHand);
      setGameState('PLAYING');
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('room_created');
      socket.off('game_started');
      socket.off('error');
    };
  }, []);

  const handleCreateRoom = () => {
    socket.connect();
    socket.emit('create_room', 'Player 1');
  };

  const handleJoinRoom = () => {
    const id = prompt('Enter Room ID:');
    if (id) {
      socket.connect();
      socket.emit('join_room', { roomId: id, name: 'Player 2' });
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      {/* --- 3D Canvas --- */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 15, 10]} fov={40} />
        <ambientLight intensity={0.5} />

        <Suspense fallback={<Loader />}>
          <Environment preset="city" blur={1} />
          <Atmosphere />
          <Table3D />

          {/* Post-processing */}
          <EffectComposer enableNormalPass>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <Noise opacity={0.05} />
          </EffectComposer>

          {/* --- Player Hand --- */}
          <group position={[0, 0.55, 3.5]}>
            <BioChipsStack count={30} position={[-6, 0, 0]} />
            <group position={[0, 0, 0]}>
              {myHand.length
                ? myHand.map((card, i) => (
                    <Card3D key={i} position={[(i - 2) * 1.5, 0, 0]} rank={card.rank} suit={card.suit} />
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <Card3D key={i} position={[(i - 2) * 1.5, 0, 0]} rank="?" suit="♠" isFaceUp={false} />
                  ))}
            </group>
            <BioChipsStack count={10} position={[6, 0, 0]} />
          </group>

          {/* --- Opponent Side --- */}
          <group position={[0, 0.55, -3.5]} rotation={[0, 0, Math.PI]}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Card3D key={i} position={[(i - 2) * 1.5, 0, 0]} rank="?" suit="♠" isFaceUp={false} />
            ))}
          </group>

          {/* Pot */}
          <BioChipsStack count={15} position={[4, 0.55, 0]} />
          <TargetDisplay value={36} />
        </Suspense>

        {/* Shadows and controls */}
        <ContactShadows opacity={0.7} scale={30} blur={2} far={4} />
        <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={30} enabled={gameState === 'PLAYING'} />
      </Canvas>

      {/* --- UI Overlay --- */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
        {/* Header */}
        <div style={{ position: 'absolute', top: '30px', left: '30px', color: 'white', fontFamily: 'monospace' }}>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              letterSpacing: '5px',
              color: '#ffd700',
              margin: 0,
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            AIR POKER
          </h1>
          {roomId && <div style={{ color: '#aaa', marginTop: '10px' }}>ROOM: {roomId}</div>}
        </div>

        {/* Lobby Modal */}
        {gameState === 'LOBBY' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(5px)',
              pointerEvents: 'auto',
              zIndex: 20,
            }}
          >
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontFamily: 'monospace', letterSpacing: '3px', marginBottom: '20px' }}>
              ENTER THE VOID
            </h2>

            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={handleCreateRoom}
                style={{
                  padding: '15px 40px',
                  backgroundColor: '#ffd700',
                  color: 'black',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                CREATE ROOM
              </button>

              <button
                onClick={handleJoinRoom}
                style={{
                  padding: '15px 40px',
                  backgroundColor: 'transparent',
                  color: '#ffd700',
                  border: '2px solid #ffd700',
                  borderRadius: '5px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                JOIN ROOM
              </button>
            </div>

            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '20px' }}>
              Server Status: {socket.connected ? 'Connected' : 'Ready'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

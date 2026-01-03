import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Atmosphere } from './Atmosphere';
import { Table3D } from '../Game/Table3D';
import { BioChipsStack } from '../Game/BioChipsSprite'; 
import { Card3D } from '../Game/Card3D';
import { NumberCard3D } from '../Game/NumberCard3D';
import { TargetSlot } from '../Game/TargetSlot';

const Loader = () => <Html center><div className="text-yellow-500 font-mono">LOADING...</div></Html>;

export const GameScene = ({ state, onTargetClick }: any) => {
  // SAFETY CHECK: If state is missing, don't render anything yet
  if (!state) return null;

  const { 
    myNumberHand = [],      // Default to empty array
    selectedTargetId, 
    selectedCardIds = [],   // Default to empty array
    globalDeck = [],        // Default to empty array
    bios = 0, 
    opponentBios = 0, 
    opponentStatus, 
    roundResult,
    opponentRevealedValue = 0 
  } = state;

  return (
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

        {/* --- TABLE SLOTS --- */}
        <TargetSlot position={[0, 0.55, 2]} label="YOUR TARGET" />
        <TargetSlot position={[0, 0.55, -2]} label="OPPONENT" />

        {/* --- YOUR NUMBER CARDS --- */}
        {/* SAFE MAPPING: Uses ?. to prevent crashes */}
        {myNumberHand?.map((card: any, i: number) => {
           const isSelected = card.id === selectedTargetId;
           const pos: [number, number, number] = isSelected ? [0, 0.60, 2] : [(i - 2) * 1.8, 0.55, 5];
           return (
             <NumberCard3D 
                key={card.id} 
                value={card.value} 
                position={pos} 
                isSelected={isSelected} 
                isUsed={card.isUsed} 
                onClick={() => onTargetClick(card.id)} 
             />
           );
        })}

        {/* --- OPPONENT TARGET CARD --- */}
        {/* SAFE CHECK: opponentStatus?.targetLocked */}
        {(opponentStatus?.targetLocked || roundResult) && (
           <NumberCard3D 
             value={opponentRevealedValue} 
             position={[0, 0.65, -2]} 
             isUsed={!!roundResult} 
           />
        )}

        {/* --- PLAYING CARDS --- */}
        {selectedCardIds?.map((id: string, i: number) => {
           const c = globalDeck?.find((x: any) => x.id === id);
           if(!c) return null;
           return <Card3D key={id} position={[(i - 2) * 1.5, 0.6, 0]} rank={c.rank} suit={c.suit} />;
        })}

        {/* --- CHIPS --- */}
        <BioChipsStack count={bios || 0} position={[-6, 0.55, 3]} />
        <BioChipsStack count={opponentBios || 0} position={[6, 0.55, -3]} />

      </Suspense>
      <ContactShadows opacity={0.7} scale={40} blur={2} />
      <OrbitControls maxPolarAngle={Math.PI/2.1} minDistance={10} maxDistance={30} />
    </Canvas>
  );
};
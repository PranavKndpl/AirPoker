import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";

import { Atmosphere } from "./Atmosphere";
import { Table3D } from "../Game/Table3D";
import { BioChipsStack } from "../Game/BioChipsSprite";
import { Card3D } from "../Game/Card3D";
import { NumberCard3D } from "../Game/NumberCard3D";
import { TargetSlot } from "../Game/TargetSlot";
import type { SuitSymbol } from "../../../../shared/types";

interface NumberCard { id: string; value: number; isUsed: boolean; }
interface PlayingCard { id: string; rank: string; suit: SuitSymbol; value: number; }
interface GameSceneProps {
  phase: string;
  localStep: string;
  myNumberHand: NumberCard[];
  selectedTargetId: string | null;
  selectedCardIds: string[];
  globalDeck: PlayingCard[];
  targetValue: number;
  opponentTargetValue: number;
  bios: number;
  opponentBios: number;
  opponentLocked: boolean;
  onTargetClick: (id: string) => void;
}

const Loader = () => <Html center><div className="text-yellow-500 font-mono">LOADING...</div></Html>;

// --- CAMERA ANIMATOR (Adjusted for lower "Seated" view) ---
const CameraAnimator = ({ active }: { active: boolean }) => {
  useFrame((state) => {
    if (!active) return;
    
    // 1. SWOOP TARGET: 
    // y=6 (Lower, seated eye-level)
    // z=13 (Distance to see the bottom rail border)
    state.camera.position.lerp(new THREE.Vector3(0, 3, 13), 0.06);
    
    // 2. LOOK AT: 
    // Look at y=-1 (Table Surface) and z=-2 (Slightly forward) 
    // to create a nice perspective down the length of the table.
    state.camera.lookAt(0, -1, -2); 
  });
  return null;
};

export const GameScene = ({
  phase,
  myNumberHand,
  selectedTargetId,
  selectedCardIds,
  globalDeck,
  opponentTargetValue,
  bios,
  opponentBios,
  opponentLocked,
  onTargetClick,
}: GameSceneProps) => {

  const showOpponentCard = opponentLocked || phase === "RESOLUTION" || phase === "GAME_OVER";

  return (
    <Canvas shadows style={{ position: "absolute", inset: 0, background: '#050505' }}>
      
      {/* 1. STARTING CAMERA (Top Down) */}
      <PerspectiveCamera makeDefault position={[0, 25, 10]} fov={38} />
      
      {/* 2. ANIMATOR */}
      <CameraAnimator active={true} />

      {/* 3. LIGHTING */}
      <ambientLight intensity={1.4} color="#ffffff" />
      
      {/* Main Table Spot */}
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.8} 
        penumbra={0.5} 
        intensity={2.5} 
        castShadow 
        shadow-bias={-0.0001}
      />
      
      {/* Warm Hand Light */}
      <pointLight position={[0, 6, 5]} intensity={1.0} color="#ffaa00" distance={15} />

      <Suspense fallback={<Loader />}>
        <Environment preset="city" blur={1} />
        
        <Atmosphere />
        <Table3D />

        <EffectComposer enableNormalPass>
          <Bloom luminanceThreshold={0.8} intensity={1.2} radius={0.5} />
          <Vignette darkness={0.8} offset={0.2} />
          <Noise opacity={0.05} />
        </EffectComposer>

        {/* --- OBJECT POSITIONS --- */}
        
        <TargetSlot position={[0, -1.98, 2]} label="YOUR TARGET" />
        <TargetSlot position={[0, -1.98, -2]} label="OPPONENT" />

        {/* YOUR HAND */}
        {myNumberHand.map((card, i) => {
          if (card.isUsed) return null;
          const isSelected = card.id === selectedTargetId;
          const position: [number, number, number] = isSelected
            ? [0, -1.8, 2] 
            : [(i - 2) * 1.8, -1.9, 5]; 
          
          return (
            <NumberCard3D
              key={card.id}
              value={card.value}
              position={position}
              isSelected={isSelected}
              isUsed={false}
              onClick={() => onTargetClick(card.id)}
            />
          );
        })}

        {/* OPPONENT TARGET */}
        {showOpponentCard && (
          <NumberCard3D
            key="opponent-target"
            value={opponentTargetValue}
            position={[0, -1.8, -2]}
            isUsed={false}
          />
        )}

        {/* PLAYED CARDS */}
        {selectedCardIds.map((id, i) => {
          const card = globalDeck.find(c => c.id === id);
          if (!card) return null;
          return (
            <Card3D
              key={card.id}
              position={[(i - 2) * 1.5, -1.9, 0]}
              rank={card.rank}
              suit={card.suit}
            />
          );
        })}

        {/* CHIPS */}
        <BioChipsStack count={bios} position={[-7, -1.1, 5]} />
        <BioChipsStack count={opponentBios} position={[7, -1.9, -3]} />

      </Suspense>

      <ContactShadows opacity={0.6} scale={40} blur={2.5} far={10} color="#000000" />

      {/* 4. CONTROLS (Updated Locking) */}
      <OrbitControls
        target={[0, -2, 0]} 
        maxPolarAngle={Math.PI / 2.1} 
        minPolarAngle={Math.PI / 6}
        
        // 🔒 SIDE LOCKING: +/- 80 degrees (Math.PI / 2.2)
        // This lets you rotate almost 90 degrees to see the side profile ("adjacent side")
        // but stops you before you get behind the table.
        minAzimuthAngle={-Math.PI / 3.5} 
        maxAzimuthAngle={Math.PI / 3.5}
        
        minDistance={22}
        maxDistance={28}
        enablePan={false}
      />
    </Canvas>
  );
};
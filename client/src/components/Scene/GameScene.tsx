// client/src/components/Scene/GameScene.tsx
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
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { Atmosphere } from "./Atmosphere";
import { Table3D } from "../Game/Table3D";
import { BioChips3D } from "../Game/BioChips3D";
import { Card3D } from "../Game/Card3D";
import { NumberCard3D } from "../Game/NumberCard3D";
import { TargetSlot } from "../Game/TargetSlot";
import type { SuitSymbol } from "../../../../shared/types";

// ... Interfaces ...
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

const CameraAnimator = ({ active }: { active: boolean }) => {
  useFrame((state) => {
    if (!active) return;
    state.camera.position.lerp(new THREE.Vector3(0, 9, 9), 0.06);
    state.camera.lookAt(0, -2, -1); 
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

  const showOpponentCard =
    opponentLocked || phase === "RESOLUTION" || phase === "GAME_OVER";

  return (
    <Canvas
      shadows
      dpr={1} 
      style={{ position: "absolute", inset: 0, background: "#000000" }}
      gl={{ 
        antialias: true, 
        powerPreference: "high-performance",
        toneMapping: THREE.ReinhardToneMapping, 
        toneMappingExposure: 1.2 
      }}
    >
      {/* 1. ATMOSPHERE */}
      <fog attach="fog" args={["#000000", 8, 25]} /> 

      <PerspectiveCamera makeDefault position={[0, 25, 10]} fov={38} />
      <CameraAnimator active={true} />
      
      <Environment preset="warehouse" background={false} />

      {/* 2. LIGHTING */}
      <ambientLight intensity={0.15} color="#404060" />
      
      {/* A. Player Hand Light (Shadows ON) */}
      <spotLight
        position={[0, 8, 8]}
        angle={0.4}
        penumbra={0.4}
        intensity={2.0}
        color="#ffaa44"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* B. Blue Rim Light (Shadows OFF) */}
      <spotLight
        position={[0, 8, -6]}
        target-position={[0, -2, -2]}
        angle={0.4}
        penumbra={0.6}
        intensity={3.5}
        color="#44aaff"
      />

      {/* C. Center God Ray (Shadows OFF) */}
      <spotLight
        position={[0, 15, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={1.2}
        color="#ffffff"
      />

      {/* D. 🔥 THE HERO PIN-LIGHT 🔥 */}
      {/* Specifically positioned to hit the Opponent's card back */}
      <spotLight
        position={[0, 6, 0]}        // High enough to be out of frame
        target-position={[0, -2, -2]} // Pointing DIRECTLY at the opponent card slot
        angle={0.25}                  // Narrow beam (Spotlight)
        penumbra={0.2}                // Sharp edges
        intensity={7.0}               // High intensity to make the symbol pop
        distance={15}
        color="#ffffff"               // Pure white to show texture colors accurately
        // No shadows = No Lag
      />

      {/* 3. POST PROCESSING */}
      <EffectComposer multisampling={0} enableNormalPass={true}> 
        <Bloom 
          luminanceThreshold={0.8} 
          intensity={0.4} 
          radius={0.5} 
          mipmapBlur={false} 
        />
        <Vignette darkness={0.85} offset={0.1} />
      </EffectComposer>

      {/* 4. SCENE CONTENT */}
      <Suspense fallback={<Loader />}>
        <Atmosphere />
        <Table3D />

        <TargetSlot position={[0, -1.98, 2]} label="YOUR TARGET" />
        <TargetSlot position={[0, -1.98, -2]} label="OPPONENT" />

        {/* YOUR HAND */}
        {myNumberHand.map((card, i) => {
          if (card.isUsed) return null;
          const isSelected = card.id === selectedTargetId;
          const position: [number, number, number] = isSelected
            ? [0, -1.8, 2]
            : [(i - 2) * 2, -1.9, 5];

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
          const card = globalDeck.find((c) => c.id === id);
          if (!card) return null;
          return (
            <Card3D
              key={card.id}
              position={[(i - 2) * 1.8, -1.9, 0]}
              rank={card.rank}
              suit={card.suit}
            />
          );
        })}

        {/* CHIPS - HD SPRITE STACKS */}
        
        {/* Left Side (You) */}
        {/* Y CHANGED: -1.95 -> -1.0 */}
        <group position={[-7.5, -1.0, 5.5]}>
           <BioChips3D count={bios} position={[0, 0, 0]} />
        </group>

        {/* Right Side (Opponent) */}
        {/* Y CHANGED: -1.95 -> -1.0 */}
        <group position={[7.5, -1.0, -3]}>
           <BioChips3D count={opponentBios} position={[0, 0, 0]} />
        </group>
     
      </Suspense>

      <ContactShadows
        frames={1} 
        opacity={0.6}
        scale={40}
        blur={1.5}
        far={4}
        resolution={256} 
        color="#000000"
      />

      <OrbitControls
        target={[0, -2, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        minAzimuthAngle={-Math.PI / 3.5}
        maxAzimuthAngle={Math.PI / 3.5}
        minDistance={22}
        maxDistance={28}
        enablePan={false}
      />
    </Canvas>
  );
};
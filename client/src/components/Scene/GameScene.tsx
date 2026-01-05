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
import { BioChips3D } from "../Game/BioChips3D"; // Updated import
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

// --- 🎥 THE CINEMATIC DIRECTOR CAMERA ---
const CameraAnimator = ({ phase, localStep }: { phase: string, localStep: string }) => {
  useFrame((state) => {
    const targetPos = new THREE.Vector3();
    const lookAtPos = new THREE.Vector3();

    // 1. DEFAULT STATE (Lobby / Idle)
    targetPos.set(0, 8, 12);
    lookAtPos.set(0, -2, -2);

    // 2. TARGET SELECTION (Overview)
    // High angle to see your hand and the opponent's closed card
    if (localStep === "PICK_TARGET") {
      targetPos.set(0, 9, 9);
      lookAtPos.set(0, -2, -1);
    }

    // 3. BETTING (Intense / Low Angle)
    // Zoom in closer to the table surface to emphasize the chips
    else if (localStep === "BETTING") {
      targetPos.set(0, 5, 8); // Lower and closer
      lookAtPos.set(0, -2.5, 0); // Focus on the pot area
    }

    // 4. RESOLUTION (The "Judge" View)
    // Strict Top-Down view to see the math clearly
    else if (phase === "RESOLUTION") {
      targetPos.set(0, 12, 1); // Almost directly above
      lookAtPos.set(0, -2, 0);
    }

    // 5. GAME OVER (The Exit)
    // Slow pull back
    else if (phase === "GAME_OVER") {
      targetPos.set(0, 15, 20);
      lookAtPos.set(0, 0, 0);
    }

    // SMOOTH LERP (Cinematic movement)
    // We use a lower lerp factor (0.04) for heavy, expensive camera feel
    state.camera.position.lerp(targetPos, 0.04);
    
    // We manually interpolate the lookAt to avoid snapping
    const currentLook = new THREE.Vector3();
    state.camera.getWorldDirection(currentLook);
    
    // Rotate camera smoothly towards target
    const qStart = state.camera.quaternion.clone();
    state.camera.lookAt(lookAtPos);
    const qEnd = state.camera.quaternion.clone();
    state.camera.quaternion.copy(qStart).slerp(qEnd, 0.05);
  });
  return null;
};

export const GameScene = ({
  phase,
  localStep, // 👈 FIXED: Added this to destructuring
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
      
      {/* 1. STARTING CAMERA */}
      <PerspectiveCamera makeDefault position={[0, 25, 10]} fov={38} />
      
      {/* 2. DIRECTOR (Now has access to localStep) */}
      <CameraAnimator phase={phase} localStep={localStep} />

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

        {/* CHIPS (Using the new 3D Stacks) */}
        {/* Left Side (You) */}
        <group position={[-8.5, -2.0, 5.0]}>
           <BioChips3D count={bios} position={[0, 0, 0]} />
        </group>

        {/* Right Side (Opponent) */}
        <group position={[8.5, -2.0, -3.0]}>
           <BioChips3D count={opponentBios} position={[0, 0, 0]} />
        </group>

      </Suspense>

      <ContactShadows opacity={0.6} scale={40} blur={2.5} far={10} color="#000000" />

      {/* 4. CONTROLS */}
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
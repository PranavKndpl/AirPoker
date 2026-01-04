// client/src/components/Scene/GameScene.tsx
import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";

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

/* ---------------- TYPES ---------------- */

interface NumberCard {
  id: string;
  value: number;
  isUsed: boolean;
}

interface PlayingCard {
  id: string;
  rank: string;
  suit: SuitSymbol;
  value: number;
}

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

  opponentLocked: boolean; // <-- NEW PROP

  onTargetClick: (id: string) => void;
}

/* ---------------- LOADER ---------------- */

const Loader = () => (
  <Html center>
    <div className="text-yellow-500 font-mono">LOADING...</div>
  </Html>
);

/* ---------------- MAIN SCENE ---------------- */

export const GameScene = ({
  phase,
  localStep,

  myNumberHand,
  selectedTargetId,
  selectedCardIds,

  globalDeck,

  targetValue,
  opponentTargetValue,

  bios,
  opponentBios,

  opponentLocked, // <-- NEW

  onTargetClick,
}: GameSceneProps) => {
  /* ---------------- INIT ---------------- */

  useEffect(() => {
    console.log("Scene initialized");
    return () => {
      console.log("Scene disposed");
    };
  }, []);

  /* ---------------- DATA UPDATES ---------------- */

  useEffect(() => {
    console.log("Deck/hand updated", {
      globalDeck,
      myNumberHand,
      selectedCardIds,
      selectedTargetId,
      opponentTargetValue,
    });
  }, [globalDeck, myNumberHand, selectedCardIds, selectedTargetId, opponentTargetValue]);

  /* ---------------- VISIBILITY LOGIC ---------------- */

  const showOpponentCard =
    opponentLocked || phase === "RESOLUTION" || phase === "GAME_OVER";

  return (
    <Canvas shadows style={{ position: "absolute", inset: 0 }}>
      {/* ---------------- CAMERA & LIGHT ---------------- */}
      <PerspectiveCamera makeDefault position={[0, 18, 12]} fov={35} />
      <ambientLight intensity={0.4} />

      <Suspense fallback={<Loader />}>
        <Environment preset="city" blur={1} />
        <Atmosphere />
        <Table3D />

        <EffectComposer>
          <Bloom luminanceThreshold={1} intensity={1.5} radius={0.5} />
          <Vignette darkness={1.0} />
          <Noise opacity={0.05} />
        </EffectComposer>

        {/* ---------------- TARGET SLOTS ---------------- */}
        <TargetSlot position={[0, 0.55, 2]} label="YOUR TARGET" />
        <TargetSlot position={[0, 0.55, -2]} label="OPPONENT" />

        {/* ---------------- PLAYER NUMBER CARDS ---------------- */}
        {myNumberHand.map((card, i) => {
          const isSelected = card.id === selectedTargetId;
          const position: [number, number, number] = isSelected
            ? [0, 0.6, 2]
            : [(i - 2) * 1.8, 0.55, 5];

          return (
            <NumberCard3D
              key={card.id}
              value={card.value}
              position={position}
              isSelected={isSelected}
              isUsed={card.isUsed}
              onClick={() => onTargetClick(card.id)} // Highlight only
            />
          );
        })}

        {/* ---------------- OPPONENT TARGET ---------------- */}
        {showOpponentCard && (
          <NumberCard3D
            key="opponent-target"
            value={opponentTargetValue}
            position={[0, 0.65, -2]}
            isUsed={false}
          />
        )}

        {/* ---------------- PLAYED CARDS ---------------- */}
        {selectedCardIds.map((id, i) => {
          const card = globalDeck.find(c => c.id === id);
          if (!card) return null;

          return (
            <Card3D
              key={card.id}
              position={[(i - 2) * 1.5, 0.6, 0]}
              rank={card.rank}
              suit={card.suit}
            />
          );
        })}

        {/* ---------------- BIOS CHIPS ---------------- */}
        <BioChipsStack count={bios} position={[-6, 0.55, 3]} />
        <BioChipsStack count={opponentBios} position={[6, 0.55, -3]} />
      </Suspense>

      <ContactShadows opacity={0.7} scale={40} blur={2} />

      <OrbitControls
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={20}
        enableZoom={false}
        enablePan
      />
    </Canvas>
  );
};

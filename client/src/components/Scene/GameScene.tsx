import { Suspense, useMemo } from "react";
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

import type { GameState } from "../../game/useGameState";

interface GameSceneProps {
  state: GameState;
  onTargetClick: (id: string) => void;
}

const Loader = () => (
  <Html center>
    <div className="text-yellow-500 font-mono">LOADING...</div>
  </Html>
);

export const GameScene = ({ state, onTargetClick }: GameSceneProps) => {
  if (!state) return null;

  const {
    myNumberHand = [],
    selectedTargetId,
    selectedCardIds = [],
    globalDeck = [],
    bios = 0,
    opponentBios = 0,
    roundResult,
  } = state;

  const opponentTargetValue = useMemo<number>(() => {
  if (!roundResult?.opponentTargets) return 0;

  const values = Object.values(roundResult.opponentTargets) as number[];
  return values[0] ?? 0;
  }, [roundResult]);


  return (
    <Canvas shadows style={{ position: "absolute", inset: 0 }}>
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
              onClick={() => onTargetClick(card.id)}
            />
          );
        })}

        {/* --- OPPONENT TARGET CARD --- */}
        {roundResult && opponentTargetValue > 0 && (
          <NumberCard3D
            value={opponentTargetValue}
            position={[0, 0.65, -2]}
            isUsed
          />
        )}

        {/* --- PLAYING CARDS --- */}
        {selectedCardIds.map((id, i) => {
          const card = globalDeck.find((c) => c.id === id);
          if (!card) return null;

          return (
            <Card3D
              key={id}
              position={[(i - 2) * 1.5, 0.6, 0]}
              rank={card.rank}
              suit={card.suit}
            />
          );
        })}

        {/* --- CHIPS --- */}
        <BioChipsStack count={bios} position={[-6, 0.55, 3]} />
        <BioChipsStack count={opponentBios} position={[6, 0.55, -3]} />
      </Suspense>

      <ContactShadows opacity={0.7} scale={40} blur={2} />
      <OrbitControls
        maxPolarAngle={Math.PI / 2.1}
        minDistance={10}
        maxDistance={30}
      />
    </Canvas>
  );
};

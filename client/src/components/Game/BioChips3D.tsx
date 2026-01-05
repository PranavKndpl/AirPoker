// client/src/components/Game/BioChips3D.tsx
import React, { useMemo, useEffect } from 'react';
import { useTexture, Billboard } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- CONFIGURATION ---
// 1.8 is massive (almost card width). 
const CHIP_SCALE = 2.5;       
const STACK_HEIGHT_STEP = 0.40; // Thicker spacing for bigger chips
const MAX_PER_STACK = 8;
const STACK_SPACING = 1.8;    // Wider gap between columns so they don't clip

const getStackOffset = (stackIndex: number): [number, number, number] => {
  const offsets: [number, number, number][] = [
    [0, 0, 0],
    [STACK_SPACING, 0, 0],
    [-STACK_SPACING, 0, 0],
    [STACK_SPACING * 0.5, 0, STACK_SPACING * 0.8],
    [-STACK_SPACING * 0.5, 0, STACK_SPACING * 0.8],
  ];
  return offsets[stackIndex] || [stackIndex * 0.5, 0, 0];
};

const SingleSpriteChip = ({ position, texture }: any) => {
  return (
    <Billboard
      position={position}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh castShadow receiveShadow>
        <planeGeometry args={[CHIP_SCALE, CHIP_SCALE]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          alphaTest={0.5}
          roughness={0.2}
          metalness={0.8}
          emissiveMap={texture}
          emissive="#664400"
          emissiveIntensity={0.2}
        />
      </mesh>
    </Billboard>
  );
};

export const BioChips3D = ({ count, position }: { count: number, position: [number, number, number] }) => {
  const texture = useTexture('/bios_chip.png');
  const { gl } = useThree();

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    texture.anisotropy = maxAnisotropy;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = "srgb";
    texture.needsUpdate = true;
  }, [texture, gl]);

  const chips = useMemo(() => {
    const items = [];
    let remaining = Math.min(count, 100); 
    
    let currentStack = 0;
    let countInStack = 0;

    for (let i = 0; i < remaining; i++) {
      if (countInStack >= MAX_PER_STACK) {
        currentStack++;
        countInStack = 0;
      }

      const [ox, oy, oz] = getStackOffset(currentStack);

      items.push({
        // oy is just the stack height offset
        // The base Y lift happens in GameScene
        pos: [ox, oy + (countInStack * STACK_HEIGHT_STEP), oz] as [number, number, number]
      });

      countInStack++;
    }
    return items;
  }, [count]);

  return (
    <group position={position}>
      {chips.map((data, i) => (
        <SingleSpriteChip
          key={i}
          position={data.pos}
          texture={texture}
        />
      ))}
    </group>
  );
};
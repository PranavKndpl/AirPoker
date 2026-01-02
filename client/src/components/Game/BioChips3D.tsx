import React, { useRef, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ChipProps {
  position: [number, number, number];
  texture: THREE.Texture; // Pass the loaded texture down
}

const SingleChip: React.FC<ChipProps> = ({ position, texture }) => {
  // Random rotation so the "Bios" text isn't perfectly aligned like a robot stacked them
  const randomRot = useRef(Math.random() * Math.PI * 2);

  {/* The Latch Mechanism detail */}
    <mesh position={[0.35, 0, 0]} castShadow>
    <boxGeometry args={[0.1, 0.08, 0.1]} />
    <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
    </mesh>

  return (
    <mesh position={position} rotation={[0, randomRot.current, 0]} castShadow receiveShadow>
      {/* slightly thicker cylinder to match the beefy look of your reference image */}
      <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
      
      {/* MATERIAL 0: SIDE (Gold Metal) */}
      <meshStandardMaterial attach="material-0" color="#ffcc00" roughness={0.2} metalness={0.9} />
      
      {/* MATERIAL 1: TOP (Your Image) */}
      <meshStandardMaterial attach="material-1" map={texture} roughness={0.5} metalness={0.4} />
      
      {/* MATERIAL 2: BOTTOM (Gold Metal) */}
      <meshStandardMaterial attach="material-2" color="#ffcc00" roughness={0.2} metalness={0.9} />
    </mesh>
  );
};

export const BioChips3D: React.FC<{ count: number; position: [number, number, number] }> = ({ count, position }) => {
  // Load texture once for the whole stack (Optimization)
  const biosTexture = useTexture('/bios_texture.png'); // Make sure this file is in /public
  
  // Create the stack array
  const chips = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <group position={position}>
      {chips.map((_, i) => (
        <SingleChip 
          key={i} 
          position={[0, i * 0.11, 0]} // Stack height
          texture={biosTexture} 
        />
      ))}
    </group>
  );
};
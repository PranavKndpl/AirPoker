import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';

interface ChipProps {
  position: [number, number, number];
  texture: any;
}

const SingleChip: React.FC<ChipProps> = ({ position, texture }) => {
  // Add slight random rotation so the stack looks natural, not robotic
  const rotation = useMemo(() => [0, Math.random() * Math.PI, 0], []);

  return (
    <group position={position} rotation={rotation as any}>
      <mesh castShadow receiveShadow>
        {/* BIGGER SIZE: Radius 0.55 (was 0.35), Height 0.12 (was 0.08) */}
        <cylinderGeometry args={[0.55, 0.55, 0.12, 48]} />
        
        {/* SIDE: Gold Metal - High Polish */}
        <meshStandardMaterial attach="material-0" color="#ffcc00" metalness={1.0} roughness={0.15} />
        
        {/* TOP: Texture with detail */}
        <meshStandardMaterial attach="material-1" map={texture} roughness={0.3} metalness={0.4} />
        
        {/* BOTTOM: Gold */}
        <meshStandardMaterial attach="material-2" color="#ffcc00" metalness={1.0} roughness={0.15} />
      </mesh>
    </group>
  );
};

export const BioChips3D: React.FC<{ count: number; position: [number, number, number] }> = ({ count, position }) => {
  const texture = useTexture('/bios_chip.png');

  const chips = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <group position={position}>
      {chips.map((_, i) => (
        <SingleChip 
          key={i} 
          // Increased spacing to 0.13 to account for thicker chips
          position={[0, i * 0.13, 0]} 
          texture={texture} 
        />
      ))}
    </group>
  );
};
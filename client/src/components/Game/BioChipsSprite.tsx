import React, { useMemo } from 'react';
import { useTexture, Billboard } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

interface ChipProps {
  position: [number, number, number];
  textureUrl: string;
}

const SingleSpriteChip: React.FC<ChipProps> = ({ position, textureUrl }) => {
  const texture = useTexture(textureUrl);

  return (
    <Billboard
      position={position}
      follow={true} // Keep facing the camera
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh castShadow receiveShadow>
        {/* Adjust size args to match your image aspect ratio */}
        <planeGeometry args={[1, 1]} /> 
        <meshStandardMaterial
          map={texture}
          transparent={true} // Crucial for PNG transparency
          alphaTest={0.5}    // Helps cut out the background cleanly
          roughness={0.4}
          metalness={0.5}    // Allows the sprite to still react to scene light!
        />
      </mesh>
    </Billboard>
  );
};

export const BioChipsStack: React.FC<{ count: number; position: [number, number, number] }> = ({ count, position }) => {
  // Memoize the array so we don't recalculate on every frame
  const chips = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <group position={position}>
      {chips.map((_, i) => (
        <SingleSpriteChip
          key={i}
          // The Y offset determines how "tall" the stack looks. 
          // Since it's a sprite, we stack them tightly (0.05).
          position={[0, i * 0.08, 0]} 
          textureUrl="/bios_chip.png" 
        />
      ))}
    </group>
  );
};

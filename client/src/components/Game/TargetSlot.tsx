import React from 'react';
import { Text } from '@react-three/drei';

export const TargetSlot = ({ position, label }: { position: [number, number, number], label?: string }) => {
  return (
    <group position={position}>
      {/* The Slot Indentation */}
      <mesh receiveShadow>
        <boxGeometry args={[1.6, 2.2, 0.05]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      
      {/* Glowing Border */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[1.65, 2.25, 0.04]} />
        <meshBasicMaterial color="#333" wireframe />
      </mesh>

      {/* Label */}
      {label && (
        <Text 
          position={[0, 1.3, 0]} 
          fontSize={0.15} 
          color="#666" 
          rotation={[-Math.PI/2, 0, 0]}
          anchorY="bottom"
        >
          {label}
        </Text>
      )}
    </group>
  );
};
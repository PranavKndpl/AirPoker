import React from 'react';
import { Text } from '@react-three/drei';

export const TargetSlot = ({ position, label }: { position: [number, number, number], label?: string }) => {
  return (
    <group position={position}>
      {/* 1. The "Scanner" Base (Transparent Glass) */}
      <mesh receiveShadow rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[1.6, 2.2]} />
        <meshStandardMaterial 
          color="#000" 
          transparent 
          opacity={0.3} 
        />
      </mesh>
      
      {/* 2. Glowing Border (The Zone Indicator) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.0, 1.05, 32]} /> {/* Simple Ring or Box Border */}
        {/* Let's stick to the box shape for cards */}
      </mesh>
      <lineSegments position={[0, 0.02, 0]}>
         <edgesGeometry args={[new THREE.BoxGeometry(1.6, 2.2, 0.05)]} />
         <lineBasicMaterial color="#444" opacity={0.5} transparent />
      </lineSegments>

      {/* 3. Label */}
      {label && (
        <Text 
          position={[0, 0.05, -1.3]} // Moved slightly back so it's readable on table
          fontSize={0.15} 
          color="#888" 
          rotation={[-Math.PI/2, 0, 0]}
          anchorY="top"
        >
          {label}
        </Text>
      )}
    </group>
  );
};
import * as THREE from 'three'; // Ensure THREE is imported for BoxGeometry
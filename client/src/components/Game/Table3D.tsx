import React from 'react';
import { RoundedBox } from '@react-three/drei';

export const Table3D = () => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* THE TABLE TOP (The Felt Surface) */}
      <RoundedBox args={[22, 1, 14]} radius={0.2} smoothness={4} position={[0, 0, 0]} receiveShadow>
        {/* Material 0-3: Sides (Dark Wood) */}
        <meshStandardMaterial attach="material-0" color="#2a1b0e" roughness={0.4} />
        <meshStandardMaterial attach="material-1" color="#2a1b0e" roughness={0.4} />
        <meshStandardMaterial attach="material-2" color="#0a0a0a" roughness={0.9} /> {/* Top - we cover this below */}
        <meshStandardMaterial attach="material-3" color="#2a1b0e" roughness={0.4} />
        
        {/* Material 4: Front (Wood) */}
        <meshStandardMaterial attach="material-4" color="#2a1b0e" roughness={0.4} />
        {/* Material 5: Back (Wood) */}
        <meshStandardMaterial attach="material-5" color="#2a1b0e" roughness={0.4} />
      </RoundedBox>

      {/* THE PLAYING SURFACE (The Felt Layer) */}
      {/* We place a slightly smaller plane on top to be the "cloth" */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.51, 0]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial 
          color="#5c2626" // Deep Dark Red (Usogui style)
          roughness={1}   // Fabric is very rough, no shine
          metalness={0} 
        />
      </mesh>

      {/* OPTIONAL: Table Border Light (The glowing yellow edge from your reference) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]}>
        <ringGeometry args={[9.8, 10, 64]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};
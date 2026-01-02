import React from 'react';
import { Text, Float } from '@react-three/drei';

export const TargetDisplay = ({ value }: { value: number }) => {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 1.5, 0]}>
        {/* Glass Panel */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3, 1.5, 0.1]} />
          <meshPhysicalMaterial 
            color="#000000" 
            transmission={0.9} 
            opacity={0.5} 
            roughness={0} 
            thickness={0.5} 
          />
        </mesh>
        
        {/* Border */}
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3.05, 1.55, 0.08]} />
            <meshBasicMaterial color="#ffaa00" wireframe />
        </mesh>

        {/* Label - REMOVED FONT PROP */}
        <Text 
          position={[0, 0.4, 0.06]} 
          fontSize={0.2} 
          color="#ffaa00" 
          letterSpacing={0.2}
        >
          TARGET SUM
        </Text>

        {/* Number - REMOVED FONT PROP */}
        <Text 
          position={[0, -0.1, 0.06]} 
          fontSize={0.8} 
          color="#ff3333" 
          anchorY="middle"
        >
          {value}
        </Text>
      </group>
    </Float>
  );
};
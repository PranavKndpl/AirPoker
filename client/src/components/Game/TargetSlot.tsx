import React from 'react';
import { Text } from '@react-three/drei';

export const TargetSlot = ({ position, label }: { position: [number, number, number], label?: string }) => {
  return (
    <group position={position}>
      {/* INVISIBLE ANCHOR 
         No mesh here. Just a text label floating slightly above the felt.
      */}
      {label && (
        <Text 
          position={[0, 0, -1.3]} 
          fontSize={0.15} 
          color="#aa6666" // Muted red text to blend with felt
          rotation={[-Math.PI/2, 0, 0]}
          anchorY="top"
          fillOpacity={0.7}
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" // Optional standard font
        >
          {label}
        </Text>
      )}
    </group>
  );
};
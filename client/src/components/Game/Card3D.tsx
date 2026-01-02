import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const SUIT_COLORS = {
  '♠': '#2c2c2c', 
  '♣': '#2c2c2c',
  '♥': '#d12e2e', 
  '♦': '#d12e2e',
};

interface CardProps {
  position: [number, number, number];
  rank: string;
  suit: '♠' | '♥' | '♣' | '♦';
  isFaceUp?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Card3D: React.FC<CardProps> = ({ 
  position, rank, suit, isFaceUp = true, isSelected = false, onClick 
}) => {
  const [hovered, setHover] = useState(false);
  
  // Verify this matches your file name exactly
  const backTexture = useTexture('/card_back_gold.png'); 

  const { pos, rot, scale } = useSpring({
    pos: isSelected ? [position[0], position[1] + 1.2, position[2] + 0.5] : hovered ? [position[0], position[1] + 0.3, position[2]] : position,
    rot: isSelected ? [-Math.PI / 3, 0, 0] : [-Math.PI / 2, 0, 0],
    scale: isSelected || hovered ? 1.1 : 1,
    config: { mass: 1, tension: 220, friction: 20 }
  });

  const color = SUIT_COLORS[suit] || '#000';

  const CornerValue = ({ rotation = [0, 0, 0], position }: any) => (
    <group position={position} rotation={rotation as any}>
      {/* REMOVED FONT PROP */}
      <Text position={[0, 0, 0]} fontSize={0.22} color={color} anchorX="center" anchorY="middle">
        {rank}
      </Text>
      <Text position={[0, -0.22, 0]} fontSize={0.18} color={color} anchorX="center" anchorY="middle">
        {suit}
      </Text>
    </group>
  );

  return (
    <animated.group position={pos as any} rotation={rot as any} scale={scale} onClick={onClick} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.0, 0.02]} />
        <meshStandardMaterial attach="material-0" color="#e0e0e0" />
        <meshStandardMaterial attach="material-1" color="#e0e0e0" />
        <meshStandardMaterial attach="material-2" color="#e0e0e0" />
        <meshStandardMaterial attach="material-3" color="#e0e0e0" />
        <meshStandardMaterial attach="material-4" color="#fcfcfc" roughness={0.6} metalness={0.0} />
        <meshStandardMaterial 
          attach="material-5" 
          map={backTexture} 
          color="#ffffff" 
          metalness={0.9} 
          roughness={0.3} 
          bumpMap={backTexture}
          bumpScale={0.02}
        />
      </mesh>

      {isFaceUp && (
        <group position={[0, 0, 0.011]}>
          <CornerValue position={[-0.55, 0.85, 0]} />
          <CornerValue position={[0.55, -0.85, 0]} rotation={[0, 0, Math.PI]} />

          {['J', 'Q', 'K'].includes(rank) ? (
             // REMOVED FONT PROP
             <Text position={[0, 0, 0]} fontSize={1.2} color={color} fillOpacity={0.15}>
               {rank}
             </Text>
          ) : (
             <Text position={[0, 0, 0]} fontSize={1.0} color={color}>
               {suit}
             </Text>
          )}
        </group>
      )}
    </animated.group>
  );
};
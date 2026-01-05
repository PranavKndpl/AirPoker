import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text, useTexture } from '@react-three/drei';

const SUIT_COLORS = { '♠': '#111', '♣': '#111', '♥': '#a00', '♦': '#a00' };

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
  const backTexture = useTexture('/card_back.png'); 
  backTexture.flipY = false;

  const { pos, rot, scale } = useSpring({
    pos: isSelected ? [position[0], position[1] + 1.2, position[2] + 0.5] : hovered ? [position[0], position[1] + 0.3, position[2]] : position,
    rot: isSelected ? [-Math.PI / 4, 0, 0] : [-Math.PI / 2, 0, 0],
    scale: isSelected || hovered ? 1.1 : 1,
    config: { mass: 1, tension: 220, friction: 20 }
  });

  const color = SUIT_COLORS[suit] || '#000';

  return (
    <animated.group 
      position={pos as any} 
      rotation={rot as any} 
      scale={scale} 
      onClick={onClick} 
      onPointerOver={() => setHover(true)} 
      onPointerOut={() => setHover(false)}
    >
      <mesh castShadow receiveShadow>
        {/* Paper thin geometry */}
        <boxGeometry args={[1.4, 2.0, 0.005]} /> 
        
        {/* SIDES (0-3): White Paper */}
        <meshBasicMaterial attach="material-0" color="#ffffff" />
        <meshBasicMaterial attach="material-1" color="#ffffff" />
        <meshBasicMaterial attach="material-2" color="#ffffff" />
        <meshBasicMaterial attach="material-3" color="#ffffff" />

        {/* FRONT (4): White Paper */}
        <meshBasicMaterial attach="material-4" color="#ffffff" />

        {/* BACK (5): Texture with Transparency Fix */}
        <meshBasicMaterial 
            attach="material-5" 
            map={backTexture} 
            color="#ffffff"
            // ⚡️ THE FIX ⚡️
            transparent={true} 
            alphaTest={0.5}
        />
      </mesh>

      {/* TEXT OVERLAY */}
      {isFaceUp && (
        <group position={[0, 0, 0.006]}>
           <Text position={[-0.55, 0.85, 0]} fontSize={0.25} color={color}>{rank}</Text>
           <Text position={[-0.55, 0.60, 0]} fontSize={0.2} color={color}>{suit}</Text>
           <Text position={[0.55, -0.85, 0]} rotation={[0, 0, Math.PI]} fontSize={0.25} color={color}>{rank}</Text>
           <Text position={[0.55, -0.60, 0]} rotation={[0, 0, Math.PI]} fontSize={0.2} color={color}>{suit}</Text>

           {['J', 'Q', 'K'].includes(rank) ? (
              <Text position={[0, 0, 0]} fontSize={1.0} color={color} fillOpacity={0.15}>{rank}</Text>
           ) : (
              <Text position={[0, 0, 0]} fontSize={1.2} color={color}>{suit}</Text>
           )}
        </group>
      )}
    </animated.group>
  );
};
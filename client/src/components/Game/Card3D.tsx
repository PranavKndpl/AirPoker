import React, { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber'; 
import * as THREE from 'three';

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
  const { gl } = useThree(); // Access renderer

  const backTexture = useTexture('/card_back.png'); 
  backTexture.flipY = false;

  // ⚡️ HD TEXTURE SETTINGS ⚡️
  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    backTexture.anisotropy = maxAnisotropy;
    backTexture.minFilter = THREE.LinearMipMapLinearFilter;
    backTexture.needsUpdate = true;
  }, [backTexture, gl]);

  const { pos, rot, scale } = useSpring({
    // Adjusted hover height for larger cards
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
        {/* ⚡️ INCREASED SIZE: [1.6, 2.3, 0.005] */}
        <boxGeometry args={[1.6, 2.3, 0.005]} /> 
       
        {/* SIDES (0-3) */}
        <meshBasicMaterial attach="material-0" color="#ffffff" />
        <meshBasicMaterial attach="material-1" color="#ffffff" />
        <meshBasicMaterial attach="material-2" color="#ffffff" />
        <meshBasicMaterial attach="material-3" color="#ffffff" />

        {/* FRONT (4) */}
        <meshBasicMaterial attach="material-4" color="#ffffff" />

        {/* BACK (5) */}
        <meshBasicMaterial 
            attach="material-5" 
            map={backTexture} 
            color="#ffffff"
            transparent={true} 
            alphaTest={0.5}
        />
      </mesh>

      {/* TEXT OVERLAY - SCALED UP POSITIONS */}
      {isFaceUp && (
        <group position={[0, 0, 0.006]}>
           {/* Corners */}
           <Text position={[-0.6, 0.9, 0]} fontSize={0.3} color={color}>{rank}</Text>
           <Text position={[-0.6, 0.65, 0]} fontSize={0.25} color={color}>{suit}</Text>
           <Text position={[0.6, -0.9, 0]} rotation={[0, 0, Math.PI]} fontSize={0.3} color={color}>{rank}</Text>
           <Text position={[0.6, -0.65, 0]} rotation={[0, 0, Math.PI]} fontSize={0.25} color={color}>{suit}</Text>

           {/* Center */}
           {['J', 'Q', 'K'].includes(rank) ? (
              <Text position={[0, 0, 0]} fontSize={1.2} color={color} fillOpacity={0.15}>{rank}</Text>
           ) : (
              <Text position={[0, 0, 0]} fontSize={1.4} color={color}>{suit}</Text>
           )}
        </group>
      )}
    </animated.group>
  );
};
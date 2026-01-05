// client/src/components/Game/NumberCard3D.tsx
import React, { useState, useEffect, useRef } from 'react'; 
import { useSpring, animated } from '@react-spring/three';
import { useTexture, Text } from '@react-three/drei';

interface NumberCardProps {
  value: number;
  position: [number, number, number];
  isSelected?: boolean;
  isUsed?: boolean;
  onClick?: () => void;
  isOpponentView?: boolean;
}

export const NumberCard3D: React.FC<NumberCardProps> = ({ 
  value, position, isSelected, isUsed, onClick 
}) => {
  const [hovered, setHover] = useState(false);
  
  // Textures
  const frontTexture = useTexture('/card_front.png');
  const backTexture = useTexture('/card_back.png');

  frontTexture.flipY = false;
  backTexture.flipY = false;
  frontTexture.colorSpace = "srgb";
  backTexture.colorSpace = "srgb";

  const [isRevealing, setRevealing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === 0 && value > 0) {
      setRevealing(true);
      const t = setTimeout(() => setRevealing(false), 1000);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const showBack = value === 0; 
  
  // ✅ FIX 1: Updated Local Font Path
  const fontUrl = "/Cinzel/static/Cinzel-Regular.ttf"; 

  const { pos, rot, scale } = useSpring({
    pos: isRevealing 
       ? [position[0], position[1] + 1.5, position[2]] 
       : isSelected 
          ? [position[0], position[1] + 0.4, position[2]] 
          : position,
    rot: isRevealing 
       ? [-Math.PI / 2, 0, Math.PI * 2] 
       : showBack 
          ? [Math.PI / 2, 0, 0]  
          : [-Math.PI / 2, 0, 0], 
    scale: isRevealing ? 1.2 : (hovered && !isUsed ? 1.1 : 1),
    config: { tension: 120, friction: 14 }
  });

  return (
    <animated.group 
      position={pos as any} 
      rotation={rot as any} 
      scale={scale}
    >
      <mesh 
        castShadow 
        receiveShadow
        onClick={(e) => {
          if (!isUsed && onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        onPointerOver={() => !isUsed && setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[1.4, 2.0, 0.05]} />
        
        {/* SIDES */}
        <meshStandardMaterial attach="material-0" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-1" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-2" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-3" color="#ceb064" metalness={1.0} roughness={0.2} />

        {/* FRONT */}
        <meshStandardMaterial 
          attach="material-4" 
          map={frontTexture} 
          color="#ffffff" 
          metalness={0.1} 
          roughness={0.8}
        />
        
        {/* ✅ FIX 2: CHANGED TO STANDARD MATERIAL 
            This allows it to be dark (affected by lights) instead of glowing white. 
        */}
        <meshStandardMaterial 
            attach="material-5" 
            map={backTexture} 
            color="#bbbbbb" // Slightly dim the white texture
            metalness={0.1}
            roughness={0.8}
        />
      </mesh>

      {/* TEXT */}
      {!showBack && (
        <group position={[0, 0, 0.04]}> 
           <Text
             font={fontUrl}       
             fontSize={0.55}      
             color="#2a1a0a"
             anchorX="center"
             anchorY="middle"
             outlineWidth={0.02}
             outlineColor="#8a6d3b"
             position={[0, 0, 0]}   
             fillOpacity={0.9}
           >
             {value}
           </Text>
        </group>
      )}
    </animated.group>
  );
};
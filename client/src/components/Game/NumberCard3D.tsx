import React, { useState, useEffect, useRef } from 'react'; 
import { useSpring, animated } from '@react-spring/three';
import { useTexture, Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface NumberCardProps {
  value: number;
  position: [number, number, number];
  isSelected?: boolean;
  isUsed?: boolean;
  onClick?: () => void;
}

export const NumberCard3D: React.FC<NumberCardProps> = ({ 
  value, position, isSelected, isUsed, onClick 
}) => {
  const [hovered, setHover] = useState(false);
  const { gl } = useThree();
  
  // Textures
  const frontTexture = useTexture('/card_front.png');
  const backTexture = useTexture('/card_back.png');

  // HD Texture Settings
  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    [frontTexture, backTexture].forEach(t => {
      t.anisotropy = maxAnisotropy;
      t.minFilter = THREE.LinearMipMapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.colorSpace = "srgb";
      t.flipY = false;
      t.needsUpdate = true;
    });
  }, [frontTexture, backTexture, gl]);

  // Logic to trigger the "Flip" animation when value changes (0 -> Real Number)
  const [isRevealing, setRevealing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // If value changes from 0 (Hidden) to Something (Revealed), trigger animation
    if (prevValue.current === 0 && value > 0) {
      setRevealing(true);
      // Short duration for the "Hop"
      const t = setTimeout(() => setRevealing(false), 600);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const showBack = value === 0; 
  const isOpponent = position[2] < 0; // Opponent is at z=-2
  const fontUrl = "Cinzel-Regular.woff2";

  // ⚡️ ANIMATION PHYSICS ⚡️
  const { pos, rot, scale } = useSpring({
    // 1. MOUNT ANIMATION (Slide from darkness)
    from: { 
      pos: isOpponent ? [position[0], position[1], position[2] - 8] : [position[0], -5, position[2]], 
      rot: [Math.PI / 2, 0, 0], 
      scale: 0.8 
    },
    
    // 2. ACTIVE STATE
    to: {
      pos: isRevealing 
         ? [position[0], position[1] + 1.2, position[2]] // The "Hop" height during reveal
         : isSelected 
            ? [position[0], position[1] + 0.4, position[2]] 
            : position,
            
      rot: showBack 
          ? [Math.PI / 2, 0, 0]       // Face Down (Hidden)
          : [-Math.PI / 2, 0, 0],     // Face Up (Revealed) - Clean flip, no spinning

      scale: isRevealing ? 1.15 : (hovered && !isUsed ? 1.1 : 1),
    },
    // Heavier friction for that "Heavy Metal Slab" feel
    config: { mass: 2, tension: 150, friction: 20 }
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
        {/* Slightly larger slab dimensions */}
        <boxGeometry args={[1.6, 2.3, 0.06]} />
        
        {/* GOLD SIDES */}
        <meshStandardMaterial attach="material-0" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-1" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-2" color="#ceb064" metalness={1.0} roughness={0.2} />
        <meshStandardMaterial attach="material-3" color="#ceb064" metalness={1.0} roughness={0.2} />

        {/* FRONT FACE (White/Gold) */}
        <meshStandardMaterial 
          attach="material-4" 
          map={frontTexture} 
          color="#ffffff" 
          metalness={0.1} 
          roughness={0.5}
        />
        
        {/* BACK FACE (Glowing Symbol) */}
        <meshStandardMaterial 
            attach="material-5" 
            map={backTexture} 
            color="#ffffff"
            emissiveMap={backTexture}
            emissive="#555555"
            emissiveIntensity={0.8}
            metalness={0.1}
            roughness={0.5}
        />
      </mesh>

      {/* TEXT OVERLAY */}
      {!showBack && (
        <group position={[0, 0, 0.05]}> 
           <Text
             font={fontUrl}       
             fontSize={0.65}      
             color="#ffd700"
             anchorX="center"
             anchorY="middle"
             outlineWidth={0.02}
             outlineColor="#4a3b1b"
             material-toneMapped={false}
           >
             {value}
           </Text>
        </group>
      )}
    </animated.group>
  );
};
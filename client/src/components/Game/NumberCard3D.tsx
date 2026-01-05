// client/src/components/Game/NumberCard3D.tsx
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
  isOpponentView?: boolean;
}

export const NumberCard3D: React.FC<NumberCardProps> = ({ 
  value, position, isSelected, isUsed, onClick 
}) => {
  const [hovered, setHover] = useState(false);
  const { gl } = useThree(); // 👈 Access the renderer
  
  // Textures
  const frontTexture = useTexture('/card_front.png');
  const backTexture = useTexture('/card_back.png');

  // ⚡️ HD TEXTURE SETTINGS ⚡️
  // We force the texture to stay sharp at extreme angles
  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    
    frontTexture.anisotropy = maxAnisotropy;
    frontTexture.magFilter = THREE.LinearFilter;
    frontTexture.minFilter = THREE.LinearMipMapLinearFilter;
    frontTexture.needsUpdate = true;

    backTexture.anisotropy = maxAnisotropy;
    backTexture.magFilter = THREE.LinearFilter;
    backTexture.minFilter = THREE.LinearMipMapLinearFilter;
    backTexture.needsUpdate = true;
  }, [frontTexture, backTexture, gl]);

  // Texture settings
  frontTexture.flipY = false;
  backTexture.flipY = false;
  frontTexture.colorSpace = "srgb";
  backTexture.colorSpace = "srgb";

  const [isRevealing, setRevealing] = useState(false);
  const prevValue = useRef(value);

  // ... (Keep existing reveal/useEffect logic) ...
  useEffect(() => {
    if (prevValue.current === 0 && value > 0) {
      setRevealing(true);
      const t = setTimeout(() => setRevealing(false), 1000);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const showBack = value === 0; 
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
        {/* ⚡️ SIZE INCREASE: Was [1.4, 2.0, 0.05] -> Now [1.6, 2.3, 0.06] */}
        <boxGeometry args={[1.6, 2.3, 0.06]} />
        
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
          roughness={0.5} // Lower roughness makes it slightly glossier/sharper
        />
        
        {/* BACK (Glowing) */}
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

      {/* TEXT - Adjusted position for larger card */}
      {!showBack && (
        <group position={[0, 0, 0.05]}> 
           <Text
             font={fontUrl}       
             fontSize={0.65} // Larger font for larger card      
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
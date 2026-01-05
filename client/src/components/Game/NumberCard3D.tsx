import React, { useState, useEffect, useRef } from 'react'; // Add useRef, useEffect
import { useSpring, animated } from '@react-spring/three';
import { Text } from '@react-three/drei';

interface NumberCardProps {
  value: number;
  position: [number, number, number];
  isSelected?: boolean;
  isUsed?: boolean;
  onClick?: () => void;
}

export const NumberCard3D: React.FC<NumberCardProps> = ({ value, position, isSelected, isUsed, onClick }) => {
  const [hovered, setHover] = useState(false);
  
  // 1. Detect Reveal (0 -> Number)
  const [isRevealing, setRevealing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // If value was 0 and is now Real, trigger animation
    if (prevValue.current === 0 && value > 0) {
      setRevealing(true);
      // Stop animation after 1 second
      const t = setTimeout(() => setRevealing(false), 1000);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  // 2. Spring Physics
  const { pos, rot, color, scale } = useSpring({
    // POSITION: If revealing, jump up high (y+1.5). If selected, lift a bit (y+0.2).
    pos: isRevealing 
       ? [position[0], position[1] + 1.5, position[2]] 
       : isSelected 
          ? [position[0], position[1] + 0.2, position[2]] 
          : position,
          
    // ROTATION: If revealing, do a 360 spin on Z axis (which looks like a flip on the table)
    rot: isRevealing 
       ? [-Math.PI / 2, 0, Math.PI * 2] 
       : [-Math.PI / 2, 0, 0],
       
    // SCALE: Pulse slightly when revealing
    scale: isRevealing ? 1.2 : (hovered && !isUsed ? 1.1 : 1),

    color: isUsed ? '#333' : (isSelected ? '#ffaa00' : '#880000'),
    
    config: { tension: 120, friction: 14 } // Bouncy spring
  });

  return (
    <animated.group 
      position={pos as any} 
      rotation={rot as any} 
      scale={scale}
      onClick={!isUsed ? onClick : undefined}
      onPointerOver={() => !isUsed && setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.0, 0.02]} />
        <animated.meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>

      <group position={[0, 0, 0.02]}>
         {/* TEXT LOGIC */}
         {value > 0 ? (
            <Text fontSize={0.8} color="white" anchorX="center" anchorY="middle">
            {value}
            </Text>
         ) : (
            <Text fontSize={1.0} color="#444" anchorX="center" anchorY="middle">
              ?
            </Text>
         )}
         
         {value > 0 && (
           <Text position={[0, -0.6, 0]} fontSize={0.15} color="#ffffff80">
             TARGET
           </Text>
         )}
      </group>
    </animated.group>
  );
};
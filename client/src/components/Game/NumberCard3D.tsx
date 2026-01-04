import React, { useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { Text } from "@react-three/drei";

interface NumberCardProps {
  value: number;
  position: [number, number, number];
  isSelected?: boolean;
  isUsed?: boolean;
  onClick?: () => void;
}

export const NumberCard3D: React.FC<NumberCardProps> = ({
  value,
  position,
  isSelected,
  isUsed,
  onClick,
}) => {
  const [hovered, setHover] = useState(false);

  const { pos, rot, color } = useSpring({
    pos: isSelected
      ? [position[0], position[1] + 0.2, position[2]]
      : position,
    rot: [-Math.PI / 2, 0, 0],
    color: isUsed ? "#333" : isSelected ? "#ffaa00" : "#880000",
    config: { tension: 180, friction: 12 },
  });

  return (
    <animated.group
      position={pos as any}
      rotation={rot as any}
      onClick={!isUsed ? onClick : undefined}
      onPointerOver={() => !isUsed && setHover(true)}
      onPointerOut={() => setHover(false)}
      scale={hovered && !isUsed ? 1.1 : 1}
    >
      {/* CARD BODY */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.0, 0.02]} />
        <animated.meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* TEXT LAYER */}
      <group position={[0, 0, 0.02]}>
        {value > 0 ? (
          // REAL NUMBER
          <Text
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        ) : (
          // HIDDEN / FACE-DOWN STATE
          <Text
            fontSize={1.0}
            color="#444"
            anchorX="center"
            anchorY="middle"
          >
            ?
          </Text>
        )}

        {/* LABEL */}
        <Text position={[0, -0.6, 0]} fontSize={0.15} color="#ffffff80">
          TARGET
        </Text>
      </group>
    </animated.group>
  );
};

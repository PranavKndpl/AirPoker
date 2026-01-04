import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Bubble = {
  position: [number, number, number];
  radius: number;
};

export const Atmosphere = () => {
  const groupRef = useRef<THREE.Group>(null);

  // 🔒 Generate bubbles ONCE
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: 50 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 20,
        Math.random() * 15,
        (Math.random() - 0.5) * 10
      ],
      radius: 0.05 + Math.random() * 0.1
    }));
  }, []);

  // 🎞️ Animate smoothly forever
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.position.y += delta * 0.2;
    groupRef.current.rotation.y += delta * 0.1;

    if (groupRef.current.position.y > 5) {
      groupRef.current.position.y = -5;
    }
  });

  return (
    <>
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 5, 25]} />

      <ambientLight intensity={0.2} color="#4a4a4a" />

      <spotLight
        position={[0, 10, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={2}
        castShadow
        color="#fff0d6"
      />

      <group ref={groupRef} position={[0, -5, 0]}>
        {bubbles.map((b, i) => (
          <mesh key={i} position={b.position}>
            <sphereGeometry args={[b.radius, 16, 16]} />
            <meshStandardMaterial
              color="#88ccff"
              transparent
              opacity={0.4}
              roughness={0}
              metalness={0.8}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};

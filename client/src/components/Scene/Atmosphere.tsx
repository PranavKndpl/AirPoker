import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Atmosphere = () => {
  const bubblesRef = useRef<THREE.Group>(null);

  // Animate bubbles floating slowly upward
  useFrame((state) => {
    if (bubblesRef.current) {
      bubblesRef.current.position.y = (state.clock.getElapsedTime() * 0.2) % 10;
      bubblesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      {/* 1. The Deep Dark Background Color */}
      <color attach="background" args={['#050505']} />
      
      {/* 2. Volumetric Fog to hide the infinite edge */}
      <fog attach="fog" args={['#050505', 5, 25]} />

      {/* 3. Ambient Lighting (Very dim) */}
      <ambientLight intensity={0.2} color="#4a4a4a" />

      {/* 4. The "Interrogation" Spot Light - focused on the table */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={2}
        castShadow
        color="#fff0d6" // Slight yellow tint like an old bulb
      />

      {/* 5. Floating "Air" Particles (Procedural Bubbles) */}
      <group ref={bubblesRef} position={[0, -5, 0]}>
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 20,
              Math.random() * 15,
              (Math.random() - 0.5) * 10
            ]}
          >
            <sphereGeometry args={[0.05 + Math.random() * 0.1, 16, 16]} />
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
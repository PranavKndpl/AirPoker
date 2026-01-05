import { Box, RoundedBox } from '@react-three/drei';

// COLORS
const COLOR_RAIL = "#110a08";   // Almost black leather
const COLOR_FELT = "#590505";   // Rich Blood Red
const COLOR_TRIM = "#d4af37";   // Metallic Gold
const COLOR_BASE = "#261610";   // Dark Wood

export const Table3D = () => {
  const width = 22;
  const depth = 17;
  const railThickness = 1.5;
  const railHeight = 0.5; // Much lower profile to avoid camera blocking

  return (
    <group position={[0, -2, 0]}> 
      
      {/* --- 1. THE TABLE BASE (Foundation) --- */}
      <Box args={[width, 1, depth]} position={[0, -0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COLOR_BASE} roughness={0.6} />
      </Box>

      {/* --- 2. THE PLAYING SURFACE (Velvet) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[width - 0.5, depth - 0.5]} />
        <meshStandardMaterial 
          color={COLOR_FELT} 
          roughness={1}     // Cloth is rough, no shine
          metalness={0.0} 
        />
      </mesh>

      {/* --- 3. THE RAILS (Leather Armrests) --- */}
      {/* We build 4 separate pieces so they frame the table perfectly */}
      
      {/* TOP RAIL */}
      <RoundedBox 
        args={[width + railThickness * 2, railHeight, railThickness]} 
        radius={0.2} smoothness={4} 
        position={[0, railHeight/2, -(depth/2 + railThickness/2)]}
      >
         <meshStandardMaterial color={COLOR_RAIL} roughness={0.3} metalness={0.1} />
      </RoundedBox>

      {/* BOTTOM RAIL */}
      <RoundedBox 
        args={[width + railThickness * 2, railHeight, railThickness]} 
        radius={0.2} smoothness={4} 
        position={[0, railHeight/2, (depth/2 + railThickness/2)]}
      >
         <meshStandardMaterial color={COLOR_RAIL} roughness={0.3} metalness={0.1} />
      </RoundedBox>

      {/* LEFT RAIL */}
      <RoundedBox 
        args={[railThickness, railHeight, depth]} 
        radius={0.2} smoothness={4} 
        position={[-(width/2 + railThickness/2), railHeight/2, 0]}
      >
         <meshStandardMaterial color={COLOR_RAIL} roughness={0.3} metalness={0.1} />
      </RoundedBox>

      {/* RIGHT RAIL */}
      <RoundedBox 
        args={[railThickness, railHeight, depth]} 
        radius={0.2} smoothness={4} 
        position={[(width/2 + railThickness/2), railHeight/2, 0]}
      >
         <meshStandardMaterial color={COLOR_RAIL} roughness={0.3} metalness={0.1} />
      </RoundedBox>

      {/* --- 4. GOLD TRIM (The separation line) --- */}
      <group position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        {/* We use a simple plane frame for the gold line */}
        <mesh position={[0, depth/2, 0]}>
            <boxGeometry args={[width, 0.1, 0.02]} />
            <meshStandardMaterial color={COLOR_TRIM} metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -depth/2, 0]}>
            <boxGeometry args={[width, 0.1, 0.02]} />
            <meshStandardMaterial color={COLOR_TRIM} metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[width/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
            <boxGeometry args={[depth, 0.1, 0.02]} />
            <meshStandardMaterial color={COLOR_TRIM} metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[-width/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
            <boxGeometry args={[depth, 0.1, 0.02]} />
            <meshStandardMaterial color={COLOR_TRIM} metalness={1} roughness={0.2} />
        </mesh>
      </group>

    </group>
  );
};
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// ─── 3D Smart House (Procedural) ──────────────────────────────────
function House({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating/bobbing animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5 + position[0]) * 0.08;
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* House Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1, 1.2]} />
        <meshStandardMaterial
          color={hovered ? "#14b8a6" : "#0f172a"}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* House Roof (Cone) */}
      <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.1, 0.8, 4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>

      {/* Glowing Door / Windows */}
      <mesh position={[0, -0.2, 0.61]}>
        <boxGeometry args={[0.3, 0.5, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.4, 0.1, 0.61]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-0.4, 0.1, 0.61]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

// ─── 3D Smart Tower (Procedural) ──────────────────────────────────
function SmartTower({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.2 + position[0]) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Tower body */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 2.2, 1]} />
        <meshStandardMaterial
          color={hovered ? "#f59e0b" : "#0d9488"}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Emissive grid pattern bands */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.02, 0.08, 1.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[1.02, 0.08, 1.02]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

// ─── 3D Smart Service Van (Procedural) ────────────────────────────
function ServiceVan() {
  const vanRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (vanRef.current) {
      const time = state.clock.getElapsedTime() * 0.4;
      const radius = 3.6;
      // Drive in a circle
      vanRef.current.position.x = Math.cos(time) * radius;
      vanRef.current.position.z = Math.sin(time) * radius;
      // Rotate to face direction of travel
      vanRef.current.rotation.y = -time + Math.PI / 2;
      // Slight vertical wobble to look like driving
      vanRef.current.position.y = 0.28 + Math.abs(Math.sin(time * 20)) * 0.02;
    }
  });

  return (
    <group ref={vanRef} position={[0, 0.28, 0]}>
      {/* Main Body */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.45, 0.95]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Front Cabin Section */}
      <mesh position={[0, -0.05, 0.35]} castShadow>
        <boxGeometry args={[0.48, 0.35, 0.3]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.1} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.05, 0.48]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.42, 0.2, 0.02]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Wheels */}
      {/* Front Left */}
      <mesh position={[-0.26, -0.22, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Front Right */}
      <mesh position={[0.26, -0.22, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Back Left */}
      <mesh position={[-0.26, -0.22, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {/* Back Right */}
      <mesh position={[0.26, -0.22, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Headlights (Emissive) */}
      <mesh position={[-0.18, -0.08, 0.51]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0.18, -0.08, 0.51]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Tech Roof Rack / Ladder (FSM Vibe) */}
      <group position={[0, 0.26, -0.1]}>
        <mesh>
          <boxGeometry args={[0.3, 0.03, 0.6]} />
          <meshStandardMaterial color="#0d9488" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Yellow Ladder rails */}
        <mesh position={[0.08, 0.06, 0]}>
          <boxGeometry args={[0.02, 0.03, 0.5]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[-0.08, 0.06, 0]}>
          <boxGeometry args={[0.02, 0.03, 0.5]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
    </group>
  );
}

// ─── 3D Smart Geofence Pulse Rings & Map Pin ──────────────────────
function GeofenceZone({ position, radius, color = "#0d9488" }: { position: [number, number, number]; radius: number; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      // Pulse scale and transparency
      const scale = 1 + (time % 2) * 0.25;
      ringRef.current.scale.set(scale, 1, scale);
      if (ringRef.current.material) {
        (ringRef.current.material as THREE.Material).opacity = 0.28 * (1 - (time % 2) / 2);
      }
    }
    if (pinRef.current) {
      // Hovering up and down smoothly
      pinRef.current.position.y = position[1] + 1.6 + Math.sin(time * 2.5) * 0.12;
      pinRef.current.rotation.y = time * 0.6;
    }
  });

  return (
    <group position={position}>
      {/* Geofence boundary cylinder */}
      <mesh ref={ringRef} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[radius, radius, 0.05, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer grid boundary line */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.04, radius + 0.01, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Map Pin */}
      <group ref={pinRef}>
        {/* Pin Head */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Pin Bottom Cone */}
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.13, 0.35, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Pin Inner Dot */}
        <mesh position={[0, 0, 0.2]} scale={[0.4, 0.4, 0.4]}>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      </group>
    </group>
  );
}

// ─── 3D Grid Map Terrain ──────────────────────────────────────────
function MapGrid() {
  return (
    <group>
      {/* Central circular base terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[5, 5, 0.15, 64]} />
        <meshStandardMaterial
          color="#0b0f19"
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>

      {/* Neon border glow ring */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.96, 5.02, 64]} />
        <meshBasicMaterial color="#0d9488" side={THREE.DoubleSide} />
      </mesh>

      {/* Tech Grid helper */}
      <gridHelper args={[9.5, 24, "#1e293b", "#111827"]} position={[0, 0.08, 0]} />
    </group>
  );
}

// ─── Main 3D Canvas Scene ─────────────────────────────────────────
export default function FsmThreeScene() {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[500px] relative select-none cursor-grab active:cursor-grabbing">
      {/* Background neon ambient blur */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.06)_0%,transparent_70%)]" />

      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[5.5, 4.2, 5.5]} fov={45} />
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
          minDistance={4}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />

        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        {/* Neon blue and amber highlights */}
        <pointLight position={[-3, 2, -3]} color="#06b6d4" intensity={2.5} distance={8} />
        <pointLight position={[3, 3, 3]} color="#f59e0b" intensity={2.0} distance={8} />

        {/* Scene Objects */}
        <MapGrid />
        
        {/* Geofence Zone 1 (Residential Smart House) */}
        <GeofenceZone position={[-1.8, 0.08, -1.5]} radius={1.2} color="#0d9488" />
        <House position={[-1.8, 0.58, -1.5]} />

        {/* Geofence Zone 2 (Commercial Smart Tower) */}
        <GeofenceZone position={[1.8, 0.08, 1.5]} radius={1.4} color="#f59e0b" />
        <SmartTower position={[1.8, 1.18, 1.5]} />

        {/* Service Van driving in circles */}
        <ServiceVan />

      </Canvas>
    </div>
  );
}

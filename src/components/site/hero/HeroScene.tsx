"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, Sparkles } from "@react-three/drei";
import type { Group } from "three";

/** Shared pointer position (-1..1), read every frame without re-rendering React. */
const pointer = { x: 0, y: 0 };

function BrandRing({ side }: { side: 1 | -1 }) {
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);

  useFrame((state, delta) => {
    if (ring.current) {
      ring.current.rotation.z += delta * 0.18;
      ring.current.rotation.x = 0.55 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
    if (group.current) {
      // Ease toward the pointer for a soft parallax.
      group.current.rotation.y += (pointer.x * 0.35 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (-pointer.y * 0.2 - group.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={group} position={[side * 2.6, 0.2, 0]}>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.8}>
        <group ref={ring}>
          {/* The ring echoes the circular mark in Bariq's logo. */}
          <mesh>
            <torusGeometry args={[1.55, 0.34, 64, 160]} />
            <meshPhysicalMaterial color="#612aae" metalness={0.35} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} iridescence={0.6} iridescenceIOR={1.4} emissive="#3a1673" emissiveIntensity={0.25} />
          </mesh>
          <mesh rotation={[0, 0, 0.6]}>
            <torusGeometry args={[2.25, 0.025, 16, 200]} />
            <meshStandardMaterial color="#cda9ff" emissive="#cda9ff" emissiveIntensity={0.8} transparent opacity={0.7} />
          </mesh>
        </group>
      </Float>

      <Float speed={2} rotationIntensity={1.2} floatIntensity={1.6}>
        <mesh position={[side * -1.9, 1.5, 0.6]} scale={0.32}>
          <icosahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial color="#cda9ff" metalness={0.2} roughness={0.15} clearcoat={1} flatShading />
        </mesh>
      </Float>
      <Float speed={1.6} rotationIntensity={1.5} floatIntensity={1.2}>
        <mesh position={[side * 1.8, -1.6, 0.8]} scale={0.26}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial color="#3a1673" metalness={0.5} roughness={0.2} clearcoat={1} flatShading />
        </mesh>
      </Float>
      <Float speed={2.4} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[side * 2.1, 1.3, -0.6]} scale={0.18}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial color="#8b4fe0" metalness={0.3} roughness={0.2} clearcoat={1} flatShading />
        </mesh>
      </Float>
    </group>
  );
}

/** Three.js hero backdrop: a glossy brand ring with floating crystals and sparkles. */
export default function HeroScene({ dir }: { dir: "rtl" | "ltr" }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [small, setSmall] = useState(false);
  // The image sits on the end side of the hero: left in Arabic, right in English.
  const side = dir === "rtl" ? -1 : 1;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (wrapper.current) io.observe(wrapper.current);
    const mq = window.matchMedia("(max-width: 1023px)");
    const onMq = () => setSmall(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const camera = useMemo(() => ({ position: [0, 0, 7.5] as [number, number, number], fov: 42 }), []);

  return (
    <div ref={wrapper} className="pointer-events-none absolute inset-0" aria-hidden>
      <Canvas
        camera={camera}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "never"}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffffff" />
        <pointLight position={[-4, -2, 3]} intensity={30} color="#cda9ff" />
        <group position={small ? [side * -2.6, 1.6, -2.5] : [0, 0, 0]} scale={small ? 0.8 : 1}>
          <BrandRing side={side} />
        </group>
        <Sparkles count={small ? 40 : 80} scale={[12, 7, 4]} size={3} speed={0.35} opacity={0.8} color="#b07bff" />
        {/* Procedural studio lighting for reflections: no network fetch. */}
        <Environment resolution={128}>
          <Lightformer form="ring" intensity={3} color="#cda9ff" position={[0, 3, -6]} scale={6} />
          <Lightformer form="rect" intensity={2} color="#ffffff" position={[-5, 1, 2]} scale={[2, 6, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#612aae" position={[5, -1, 2]} scale={[2, 6, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

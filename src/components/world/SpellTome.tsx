import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";

interface SpellTomeProps {
    position: [number, number, number];
    spell: string;
    color: string;
}

export const SpellTome = ({ position, spell, color }: SpellTomeProps) => {
    const [status, setStatus] = useState<'idle' | 'animating' | 'gone'>('idle');
    const visualRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (status === 'gone') return;

        if (status === 'animating' && visualRef.current) {
            // Animation: Scale up and fade out (move up quickly)
            visualRef.current.position.y += 0.1;
            visualRef.current.scale.multiplyScalar(1.05);
        } else if (status === 'idle' && visualRef.current) {
            // Idle Animation
            visualRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
            visualRef.current.rotation.y += 0.02;
        }
    });

    const handlePickup = (e: any) => {
        if (status !== 'idle') return;

        // Only allow players to pick up
        const name = e.other.rigidBodyObject?.name || "";
        if (!name.startsWith("Player-")) return;

        setStatus('animating');
        window.dispatchEvent(new CustomEvent('change-spell', { detail: spell }));

        // Remove after animation
        setTimeout(() => {
            setStatus('gone');

            // Respawn after 5 seconds
            setTimeout(() => {
                setStatus('idle');
            }, 5000);
        }, 500);
    };

    const getIcon = () => {
        switch (spell) {
            case 'fireball': return <sphereGeometry args={[0.2]} />;
            case 'magic_missile': return <coneGeometry args={[0.15, 0.4, 4]} />;
            case 'lightning': return <dodecahedronGeometry args={[0.2]} />;
            case 'ice_shard': return <octahedronGeometry args={[0.2]} />;
            default: return <boxGeometry args={[0.2, 0.2, 0.2]} />;
        }
    };

    if (status === 'gone') return null;

    return (
        <group position={position}>
            {/* Physics Sensor - Only present when idle */}
            {status === 'idle' && (
                <RigidBody name="tome" type="fixed" sensor onIntersectionEnter={handlePickup}>
                    <BallCollider args={[0.8]} />
                </RigidBody>
            )}

            {/* Visuals - Independent of physics body for animation */}
            <group ref={visualRef}>
                {/* Book Model */}
                <group rotation={[0.5, 0, 0]}>
                    {/* Left Page */}
                    <mesh position={[-0.25, 0, 0]} rotation={[0, 0.2, 0]}>
                        <boxGeometry args={[0.4, 0.6, 0.05]} />
                        <meshStandardMaterial color="#F5DEB3" />
                    </mesh>
                    {/* Right Page */}
                    <mesh position={[0.25, 0, 0]} rotation={[0, -0.2, 0]}>
                        <boxGeometry args={[0.4, 0.6, 0.05]} />
                        <meshStandardMaterial color="#F5DEB3" />
                    </mesh>
                    {/* Cover */}
                    <mesh position={[0, -0.03, 0]}>
                        <boxGeometry args={[0.9, 0.65, 0.05]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                </group>

                {/* Floating Icon */}
                <mesh position={[0, 0.5, 0]}>
                    {getIcon()}
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                </mesh>

                {/* Glow Effect */}
                <pointLight color={color} intensity={2} distance={3} />
            </group>
        </group>
    );
};

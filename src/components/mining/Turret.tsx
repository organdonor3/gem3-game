import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../stores/useGameStore';
import * as THREE from 'three';

interface TurretProps {
    position: [number, number, number];
    level: number;
    ownerId: string;
}

export const Turret = ({ position, level }: TurretProps) => {
    const group = useRef<THREE.Group>(null);
    const head = useRef<THREE.Group>(null);
    const { damageCrystal, crystalHealth } = useGameStore();
    const lastFireTime = useRef(0);

    // Stats based on level
    const damage = 5 * level;
    const fireRate = Math.max(0.5, 2 - level * 0.2); // Faster fire rate with level

    useFrame((state) => {
        if (!head.current) return;

        // Aim at Crystal (0, 2, 0)
        head.current.lookAt(0, 2, 0);

        // Fire Logic
        const time = state.clock.elapsedTime;
        if (time - lastFireTime.current > fireRate) {
            if (crystalHealth > 0) {
                // Visual Effect (Laser?)
                // For now, just a simple line or projectile would be cool, but let's stick to logic first
                damageCrystal(damage);
                lastFireTime.current = time;

                // Trigger a visual event?
                // window.dispatchEvent(new CustomEvent('turret-fire', { detail: { position, target: [0, 2, 0] } }));
            }
        }
    });

    return (
        <RigidBody type="fixed" position={position} colliders="hull">
            <group ref={group}>
                {/* Base */}
                <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.8, 1, 1]} />
                    <meshStandardMaterial color="#444" />
                </mesh>

                {/* Rotating Head */}
                <group ref={head} position={[0, 1, 0]}>
                    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.4, 0.4, 1.5]} />
                        <meshStandardMaterial color={level > 1 ? "#ffaa00" : "#888"} />
                    </mesh>
                    {/* Barrel Tip */}
                    <mesh position={[0, 0, 0.8]}>
                        <boxGeometry args={[0.2, 0.2, 0.2]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                </group>
            </group>
        </RigidBody>
    );
};

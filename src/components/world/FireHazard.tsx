import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { myPlayer } from 'playroomkit';
import { useGameStore } from '../../stores/useGameStore';
import * as THREE from 'three';

interface FireHazardProps {
    position: [number, number, number];
    size: [number, number, number];
}

export const FireHazard = ({ position, size }: FireHazardProps) => {
    const [isPlayerInside, setIsPlayerInside] = useState(false);
    const damageTimer = useRef(0);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state, delta) => {
        // Visual Effect: Pulse emissive intensity
        if (materialRef.current) {
            const time = state.clock.elapsedTime;
            materialRef.current.emissiveIntensity = 1.5 + Math.sin(time * 5) * 0.5;
        }

        // Damage Logic
        if (isPlayerInside) {
            damageTimer.current += delta;
            if (damageTimer.current >= 0.1) {
                useGameStore.getState().damagePlayer(1);
                damageTimer.current = 0;
            }
        } else {
            damageTimer.current = 0;
        }
    });

    const addEffect = useGameStore(state => state.addEffect);

    return (
        <group position={position}>
            {/* Visuals */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[size[0], size[2]]} />
                <meshStandardMaterial
                    ref={materialRef}
                    color="#ff4400"
                    emissive="#ff2200"
                    emissiveIntensity={1.5}
                    roughness={1}
                />
            </mesh>

            {/* Physics Sensor */}
            <RigidBody type="fixed" sensor colliders={false}>
                <CuboidCollider
                    args={[size[0] / 2, size[1] / 2, size[2] / 2]}
                    position={[0, size[1] / 2, 0]}
                    onIntersectionEnter={(payload) => {
                        const userData = payload.other.rigidBody?.userData as any;
                        if (userData && userData.tag === 'player' && userData.id === myPlayer().id) {
                            setIsPlayerInside(true);
                            addEffect({ type: 'burning', duration: 3000 });
                        }
                    }}
                    onIntersectionExit={(payload) => {
                        const userData = payload.other.rigidBody?.userData as any;
                        if (userData && userData.tag === 'player' && userData.id === myPlayer().id) {
                            setIsPlayerInside(false);
                        }
                    }}
                />
            </RigidBody>
        </group>
    );
};

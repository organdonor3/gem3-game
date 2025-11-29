import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

type EnemyType = 'blob' | 'flying' | 'tank' | 'speedy';

interface EnemySpawnerProps {
    position: [number, number, number];
    type?: EnemyType;
}

export const EnemySpawner = ({ position, type = 'blob' }: EnemySpawnerProps) => {
    const [isActive, setIsActive] = useState(false);
    const portalRef = useRef<THREE.Group>(null);
    const intervalRef = useRef<any>(null);
    const playersOnPad = useRef<Set<string>>(new Set());

    // Continuous Spawning Logic
    useEffect(() => {
        if (isActive) {
            // Spawn immediately on enter
            spawnEnemy();

            // Then every 3 seconds
            intervalRef.current = setInterval(spawnEnemy, 3000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    const spawnEnemy = () => {
        window.dispatchEvent(new CustomEvent('spawn-request', {
            detail: {
                type,
                position: { x: position[0], y: position[1] + 2, z: position[2] }
            }
        }));
    };

    useFrame((state) => {
        if (portalRef.current) {
            portalRef.current.rotation.y += isActive ? 0.1 : 0.02; // Spin faster when active
            const scale = 1 + Math.sin(state.clock.getElapsedTime() * (isActive ? 10 : 5)) * 0.1;
            portalRef.current.scale.set(scale, 1, scale);
        }
    });

    const handleEnter = (e: any) => {
        const name = e.other.rigidBodyObject?.name || "";
        if (name.startsWith("Player-")) {
            playersOnPad.current.add(name);
            setIsActive(true);
        }
    };

    const handleExit = (e: any) => {
        const name = e.other.rigidBodyObject?.name || "";
        if (name.startsWith("Player-")) {
            playersOnPad.current.delete(name);
            if (playersOnPad.current.size === 0) {
                setIsActive(false);
            }
        }
    };

    const getColor = () => {
        switch (type) {
            case 'blob': return '#32CD32';
            case 'flying': return '#9370DB';
            case 'tank': return '#8B0000';
            case 'speedy': return '#FFD700';
            default: return 'red';
        }
    };

    return (
        <group position={position}>
            {/* Physics Trigger - Large Box for reliability */}
            <RigidBody name="spawner" type="fixed" colliders={false} sensor onIntersectionEnter={handleEnter} onIntersectionExit={handleExit}>
                <CuboidCollider args={[2.5, 1, 2.5]} position={[0, 1, 0]} />
            </RigidBody>

            {/* Visuals */}
            <group ref={portalRef}>
                <Cylinder args={[2.5, 2.5, 0.1, 32]}>
                    <meshStandardMaterial
                        color={isActive ? "white" : getColor()}
                        emissive={getColor()}
                        emissiveIntensity={isActive ? 5 : 1}
                        transparent
                        opacity={0.8}
                    />
                </Cylinder>
                <Cylinder args={[2.2, 2.2, 0.15, 32]}>
                    <meshBasicMaterial color="black" />
                </Cylinder>

                {/* Active Beam */}
                {isActive && (
                    <Cylinder args={[2.4, 2.4, 10, 32]} position={[0, 5, 0]} material-transparent material-opacity={0.2}>
                        <meshBasicMaterial color={getColor()} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
                    </Cylinder>
                )}
            </group>
        </group>
    );
};

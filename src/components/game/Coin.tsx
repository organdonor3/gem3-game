import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';

export const Coin = ({ position }: { position: [number, number, number] }) => {
    const ref = useRef<THREE.Mesh>(null);
    const [collected, setCollected] = useState(false);
    const addScore = useGameStore((state) => state.addScore);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 2;
        }
    });

    const onEnter = () => {
        if (!collected) {
            setCollected(true);
            addScore(10);
            import('../../systems/AudioManager').then(({ audioManager }) => audioManager.play('collect'));
        }
    };

    if (collected) return null;

    return (
        <RigidBody type="fixed" colliders={false} position={position} sensor onIntersectionEnter={onEnter}>
            <CylinderCollider args={[0.5, 0.5]} />
            <mesh ref={ref} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
                <meshStandardMaterial color="gold" metalness={1} roughness={0.3} />
            </mesh>
        </RigidBody>
    );
};

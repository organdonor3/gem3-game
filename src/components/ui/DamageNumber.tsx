import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface DamageNumberProps {
    position: [number, number, number];
    damage: number;
    onComplete: () => void;
}

export const DamageNumber = ({ position, damage, onComplete }: DamageNumberProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const lifeRef = useRef(1.0); // 1 second lifetime

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.position.y += delta * 2; // Float up
        }

        lifeRef.current -= delta;

        if (lifeRef.current <= 0) {
            onComplete();
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <Html center pointerEvents="none">
                <div style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 0px black',
                    opacity: lifeRef.current,
                    transition: 'opacity 0.1s',
                    userSelect: 'none'
                }}>
                    {damage}
                </div>
            </Html>
        </group>
    );
};

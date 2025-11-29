import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';


interface WallSpellProps {
    spell: {
        id: string;
        type: any;
        position: THREE.Vector3;
        direction: THREE.Vector3;
    };
    onRemove: () => void;
}

export const WallSpell = React.memo(({ spell, onRemove }: WallSpellProps) => {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const timer = setTimeout(onRemove, 5000);
        return () => clearTimeout(timer);
    }, []);

    useFrame((_, delta) => {
        if (height < 3) {
            setHeight(prev => Math.min(prev + delta * 10, 3));
        }
    });

    const spawnPos = spell.position.clone().add(spell.direction.clone().multiplyScalar(2));

    const lookAtMatrix = new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0),
        spell.direction,
        new THREE.Vector3(0, 1, 0)
    );
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);

    // Logic based on wallType if needed
    // const { wallType } = SpellDefinitions[spell.type] as WallSpellConfig;

    return (
        <RigidBody position={spawnPos} rotation={new THREE.Euler().setFromQuaternion(quaternion)} type="fixed">
            <mesh position={[0, height / 2 - 1.5, 0]}>
                <boxGeometry args={[4, height, 1]} />
                <meshStandardMaterial color="#8B4513" roughness={1} />
            </mesh>
        </RigidBody>
    );
});

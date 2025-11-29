import React, { useEffect } from 'react';
import * as THREE from 'three';

interface EffectSpellProps {
    spell: {
        id: string;
        type: any;
        position: THREE.Vector3;
    };
    onRemove: () => void;
}

export const EffectSpell = React.memo(({ spell, onRemove }: EffectSpellProps) => {
    useEffect(() => {
        onRemove();
    }, []);

    if (spell.type === 'heal') {
        return (
            <group position={spell.position}>
                <mesh position={[0, 1, 0]}>
                    <dodecahedronGeometry args={[0.5]} />
                    <meshStandardMaterial color="green" wireframe />
                </mesh>
            </group>
        )
    }
    return null;
});

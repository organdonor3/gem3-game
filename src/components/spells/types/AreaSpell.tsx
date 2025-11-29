import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpellDefinitions } from '../SpellDefinitions';
import type { AreaSpellConfig } from '../SpellDefinitions';

interface AreaSpellProps {
    spell: {
        id: string;
        type: any;
        position: THREE.Vector3;
    };
    onRemove: () => void;
    enemiesRef?: React.MutableRefObject<any[]>;
}

export const AreaSpell = React.memo(({ spell, onRemove, enemiesRef }: AreaSpellProps) => {
    const config = SpellDefinitions[spell.type as keyof typeof SpellDefinitions] as AreaSpellConfig;
    const { color } = config;
    const meshRef = useRef<THREE.Mesh>(null);
    const { scene } = useThree();

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.scale.addScalar(delta * 5);
            meshRef.current.rotation.y += delta * 2;
        }
    });

    useEffect(() => {
        const timer = setTimeout(onRemove, 1000);

        // Shout Logic
        if (spell.type === 'shout' && enemiesRef && enemiesRef.current) {
            const range = 15;
            enemiesRef.current.forEach((e: any) => {
                if (e.hp <= 0) return;

                // Get live position
                let ePos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
                const enemyObj = scene.getObjectByName(e.id);
                if (enemyObj) {
                    enemyObj.getWorldPosition(ePos);
                }

                const dist = spell.position.distanceTo(ePos);
                if (dist < range) {
                    const isSmall = e.type === 'speedy' || e.type === 'flying';
                    const effectType = isSmall ? 'fear' : 'lure';

                    window.dispatchEvent(new CustomEvent('apply-effect', {
                        detail: {
                            enemyId: e.id,
                            effect: effectType,
                            duration: 3000,
                            source: spell.position
                        }
                    }));
                }
            });
        }

        return () => clearTimeout(timer);
    }, []);

    return (
        <mesh ref={meshRef} position={spell.position}>
            {spell.type === 'wind_blast' ? (
                <torusGeometry args={[1, 0.2, 16, 32]} />
            ) : (
                <sphereGeometry args={[1]} />
            )}
            <meshStandardMaterial color={color} transparent opacity={0.5} emissive={color} emissiveIntensity={1} />
        </mesh>
    );
});

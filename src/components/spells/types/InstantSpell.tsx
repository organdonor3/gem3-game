import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpellAssets } from '../SpellAssetsContext';
import { SpellDefinitions } from '../SpellDefinitions';
import type { InstantSpellConfig } from '../SpellDefinitions';

interface InstantSpellProps {
    spell: {
        id: string;
        type: any;
        position: THREE.Vector3;
        direction: THREE.Vector3;
    };
    onRemove: () => void;
    enemiesRef?: React.MutableRefObject<any[]>;
}

export const InstantSpell = React.memo(({ spell, onRemove, enemiesRef }: InstantSpellProps) => {
    const config = SpellDefinitions[spell.type as keyof typeof SpellDefinitions] as InstantSpellConfig;
    const { color } = config;

    const [lightningPoints, setLightningPoints] = useState<THREE.Vector3[]>([]);
    const { scene } = useThree();
    const { lightningSegmentGeometry, lightningSegmentMaterial } = useSpellAssets();

    useEffect(() => {
        const timer = setTimeout(onRemove, 200);

        if (spell.type === 'lightning') {
            // Chain Lightning Logic
            const points: THREE.Vector3[] = [];
            const start = new THREE.Vector3(0, 0, 0); // Local space start
            points.push(start);

            // Find targets
            if (enemiesRef && enemiesRef.current && enemiesRef.current.length > 0) {
                let currentPos = spell.position.clone();
                const visited = new Set<string>();
                let targetsFound = 0;
                const maxTargets = 5;

                // Simple greedy chain
                while (targetsFound < maxTargets) {
                    let closestDist = Infinity;
                    let nextTarget = null;
                    let nextTargetPos = new THREE.Vector3();

                    enemiesRef.current.forEach((e: any) => {
                        if (visited.has(e.id) || e.hp <= 0) return;

                        // Get live position
                        let ePos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
                        const enemyObj = scene.getObjectByName(e.id);
                        if (enemyObj) {
                            enemyObj.getWorldPosition(ePos);
                        }

                        const dist = currentPos.distanceTo(ePos);
                        if (dist < closestDist && dist < 15) { // Chain range
                            closestDist = dist;
                            nextTarget = e;
                            nextTargetPos.copy(ePos);
                        }
                    });

                    if (nextTarget) {
                        visited.add((nextTarget as any).id);
                        targetsFound++;

                        // Add point relative to spell origin
                        const relativePos = nextTargetPos.clone().sub(spell.position);

                        // Add some jitter points between current and next
                        const segments = 5;
                        const prevRelative = points[points.length - 1];
                        for (let i = 1; i <= segments; i++) {
                            const t = i / segments;
                            const p = new THREE.Vector3().lerpVectors(prevRelative, relativePos, t);
                            p.add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5));
                            points.push(p);
                        }

                        currentPos = nextTargetPos;

                        // Deal Damage
                        window.dispatchEvent(new CustomEvent('enemy-hit', {
                            detail: { enemyId: (nextTarget as any).id, damage: 1 } // Light damage
                        }));

                    } else {
                        break; // No more targets in range
                    }
                }
            }

            // If no targets, just shoot forward randomly
            if (points.length === 1) {
                const end = spell.direction.clone().multiplyScalar(20);
                const segments = 10;
                for (let i = 1; i <= segments; i++) {
                    const p = start.clone().lerp(end, i / segments);
                    p.add(new THREE.Vector3((Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1));
                    points.push(p);
                }
            }
            setLightningPoints(points);
        }

        return () => clearTimeout(timer);
    }, []);

    if (spell.type === 'lightning') {
        return (
            <group position={spell.position}>
                {lightningPoints.map((p, i) => {
                    if (i === lightningPoints.length - 1) return null;
                    const next = lightningPoints[i + 1];
                    const mid = p.clone().add(next).multiplyScalar(0.5);
                    const len = p.distanceTo(next);
                    const dir = next.clone().sub(p).normalize();
                    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                    return (
                        <mesh
                            key={i}
                            position={mid}
                            rotation={new THREE.Euler().setFromQuaternion(quat)}
                            geometry={lightningSegmentGeometry}
                            material={lightningSegmentMaterial}
                            scale={[1, len, 1]}
                        />
                    )
                })}
            </group>
        );
    }

    return (
        <mesh position={spell.position} rotation={new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), spell.direction))}>
            <cylinderGeometry args={[0.1, 0.1, 20]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
        </mesh>
    );
});

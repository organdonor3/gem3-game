import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RigidBody, RapierRigidBody, interactionGroups } from '@react-three/rapier';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { onPlayerJoin, myPlayer, useMultiplayerState } from 'playroomkit';
import { useGameStore } from '../../stores/useGameStore';

// Spell Types
type SpellType =
    | 'fireball'
    | 'lightning'
    | 'ice_shard'
    | 'wind_blast'
    | 'magic_missile'
    | 'earth_wall'
    | 'heal'
    | 'blink'
    | 'black_hole'
    | 'laser_beam';

interface SpellInstance {
    id: string;
    type: SpellType;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    createdAt: number;
    playerId: string;
}

import { SpellAssets } from '../systems/GlobalPrewarmer';

// --- GLOBAL ASSETS (Optimization) ---
// Reusing geometries and materials from GlobalPrewarmer
const { magicMissile: magicMissileAssets, fireball: fireballAssets, iceShard: iceShardAssets, lightning: lightningAssets } = SpellAssets;
const magicMissileGeometry = magicMissileAssets.geometry;
const magicMissileMaterial = magicMissileAssets.material;

const fireballGeometry = fireballAssets.geometry;
const fireballMaterial = fireballAssets.material;

const iceShardGeometry = iceShardAssets.geometry;
const iceShardMaterial = iceShardAssets.material;

const lightningSegmentGeometry = lightningAssets.geometry;
const lightningSegmentMaterial = lightningAssets.material;

// Helper component to track enemies without re-rendering SpellManager
const EnemyTracker = ({ enemiesRef }: { enemiesRef: React.MutableRefObject<any[]> }) => {
    const [enemies] = useMultiplayerState('enemies', []);
    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);
    return null;
};

export const SpellManager = () => {
    // console.log("SpellManager Render"); // Uncomment to check render frequency
    const [spells, setSpells] = useState<SpellInstance[]>([]);

    // Use Ref for enemies to prevent re-renders of ProjectileSpell
    // We use a separate component to update this ref so SpellManager doesn't re-render on every enemy move
    const enemiesRef = useRef<any[]>([]);

    const addSpell = (data: any) => {
        performance.mark('spell-cast-start');
        const { type, position, direction, playerId } = data;
        const newSpell: SpellInstance = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            position: new THREE.Vector3(position.x, position.y, position.z),
            direction: new THREE.Vector3(direction.x, direction.y, direction.z),
            createdAt: Date.now(),
            playerId
        };

        setSpells(prev => {
            const next = [...prev, newSpell];
            console.log(`[Perf] Active Spells: ${next.length}`);
            return next;
        });

        requestAnimationFrame(() => {
            performance.mark('spell-cast-end');
            performance.measure('Spell Cast Time', 'spell-cast-start', 'spell-cast-end');
            const measure = performance.getEntriesByName('Spell Cast Time').pop();
            console.log(`[Perf] Spell Cast Time (${type}): ${measure?.duration.toFixed(2)}ms`);
        });
    };

    useEffect(() => {
        // Local Casts
        const handleCast = (e: any) => {
            addSpell(e.detail);
        };

        window.addEventListener('cast-spell', handleCast);
        return () => window.removeEventListener('cast-spell', handleCast);
    }, []);

    // Remote Casts
    useEffect(() => {
        const players: any[] = [];

        onPlayerJoin((state) => {
            players.push(state);

            state.onQuit(() => {
                const idx = players.indexOf(state);
                if (idx !== -1) players.splice(idx, 1);
            });
        });

        // Polling for new casts (simple and robust)
        const interval = setInterval(() => {
            players.forEach(p => {
                if (p.id === myPlayer().id) return;

                const cast = p.getState('lastCast');
                const lastProcessed = (p as any)._lastCastTime || 0;

                if (cast && cast.timestamp > lastProcessed) {
                    (p as any)._lastCastTime = cast.timestamp;
                    addSpell(cast);
                }
            });
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const removeSpell = useCallback((id: string) => {
        setSpells(prev => {
            const next = prev.filter(s => s.id !== id);
            console.log(`[Perf] Active Spells: ${next.length} (Removed ${id})`);
            return next;
        });
    }, []);

    return (
        <group>
            <EnemyTracker enemiesRef={enemiesRef} />
            {spells.map(spell => (
                <SpellController
                    key={spell.id}
                    spell={spell}
                    enemiesRef={enemiesRef}
                    removeSpell={removeSpell}
                />
            ))}
        </group>
    );
};

// Memoized SpellController to prevent re-renders of all spells when one changes/adds
const SpellController = React.memo(({ spell, enemiesRef, removeSpell }: { spell: SpellInstance, enemiesRef: React.MutableRefObject<any[]>, removeSpell: (id: string) => void }) => {
    // Stable callback for this specific spell
    const onRemove = useCallback(() => removeSpell(spell.id), [removeSpell, spell.id]);

    switch (spell.type) {
        case 'fireball': return <ProjectileSpell spell={spell} color="orange" speed={20} onRemove={onRemove} enemiesRef={enemiesRef} />;
        case 'ice_shard': return <ProjectileSpell spell={spell} color="cyan" speed={30} onRemove={onRemove} enemiesRef={enemiesRef} />;
        case 'magic_missile': return <ProjectileSpell spell={spell} color="purple" speed={15} onRemove={onRemove} enemiesRef={enemiesRef} />;
        case 'lightning': return <InstantSpell spell={spell} color="yellow" onRemove={onRemove} enemiesRef={enemiesRef} />;
        case 'laser_beam': return <InstantSpell spell={spell} color="red" onRemove={onRemove} />;
        case 'wind_blast': return <AreaSpell spell={spell} color="white" onRemove={onRemove} />;
        case 'black_hole': return <AreaSpell spell={spell} color="black" onRemove={onRemove} />;
        case 'earth_wall': return <WallSpell spell={spell} onRemove={onRemove} />;
        case 'heal': return <EffectSpell spell={spell} type="heal" onRemove={onRemove} />;
        case 'blink': return <EffectSpell spell={spell} type="blink" onRemove={onRemove} />;
        default: return null;
    }
});

const ProjectileSpell = React.memo(({ spell, color, speed, onRemove, enemiesRef }: any) => {
    const ref = useRef<RapierRigidBody>(null);
    const isFireball = spell.type === 'fireball';
    const isMagicMissile = spell.type === 'magic_missile';
    const isIceShard = spell.type === 'ice_shard';

    // Tracking Logic (Magic Missile)
    const targetIdRef = useRef<string | null>(null);
    const { scene } = useThree();

    useFrame((_state, delta) => {
        if (!ref.current) return;

        if (isMagicMissile) {
            const currentPos = ref.current.translation();
            let targetPos = new THREE.Vector3();
            let hasTarget = false;

            // 1. Try to track locked target
            if (targetIdRef.current) {
                const targetObj = scene.getObjectByName(targetIdRef.current);
                if (targetObj) {
                    targetObj.getWorldPosition(targetPos);
                    hasTarget = true;
                } else {
                    // Target lost/died
                    targetIdRef.current = null;
                }
            }

            // 2. Find new target if none locked
            if (!hasTarget && enemiesRef.current && enemiesRef.current.length > 0) {
                let closestDist = Infinity;
                let bestTargetId = null;

                enemiesRef.current.forEach((e: any) => {
                    if (e.hp <= 0) return;

                    // Use state position for initial selection (rough check)
                    const ePos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
                    const dist = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).distanceTo(ePos);

                    if (dist < closestDist && dist < 30) {
                        closestDist = dist;
                        bestTargetId = e.id;
                        targetPos.copy(ePos);
                    }
                });

                if (bestTargetId) {
                    targetIdRef.current = bestTargetId;
                    hasTarget = true;
                }
            }

            if (hasTarget) {
                const dir = targetPos.clone().sub(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)).normalize();

                // Steer towards target - Aggressive Homing
                const currentVel = ref.current.linvel();
                const currentDir = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z).normalize();
                const newDir = currentDir.lerp(dir, delta * 10).normalize(); // Increased turn speed

                ref.current.setLinvel(newDir.multiplyScalar(speed), true);
            }
        }
    });

    useEffect(() => {
        if (ref.current) {
            const vel = spell.direction.clone().multiplyScalar(speed);
            ref.current.setLinvel(vel, true);
        }

        const timer = setTimeout(onRemove, 3000);
        return () => clearTimeout(timer);
    }, []);

    const { friendlyFire } = useGameStore();

    const handleCollision = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (!other) return;

        const tag = other.userData?.tag;

        // Handle Player Hit (Friendly Fire)
        if (tag === 'player') {
            if (friendlyFire) {
                const damage = isFireball ? 3 : (isMagicMissile ? 1.5 : 0.5);
                window.dispatchEvent(new CustomEvent('player-hit', {
                    detail: { playerId: other.userData.id, damage: damage }
                }));

                if (isFireball) {
                    // Trigger Wind Blast effect on hit
                    window.dispatchEvent(new CustomEvent('cast-spell', {
                        detail: {
                            type: 'wind_blast',
                            position: ref.current?.translation(),
                            direction: new THREE.Vector3(0, 1, 0),
                            playerId: spell.playerId
                        }
                    }));
                }
                onRemove();
            }
            return;
        }

        if (tag !== 'enemy') return; // Only hit enemies (and players if FF is on)

        const damage = isFireball ? 3 : (isMagicMissile ? 1.5 : 0.5);

        if (isFireball) {
            window.dispatchEvent(new CustomEvent('cast-spell', {
                detail: {
                    type: 'wind_blast',
                    position: ref.current?.translation(),
                    direction: new THREE.Vector3(0, 1, 0),
                    playerId: spell.playerId
                }
            }));
            onRemove();
        } else {
            // Magic Missile & Ice Shard (Sensors)
            window.dispatchEvent(new CustomEvent('enemy-hit', {
                detail: { enemyId: other.name, damage: damage } // Use name which is set to ID
            }));

            if (isIceShard) {
                window.dispatchEvent(new CustomEvent('apply-effect', {
                    detail: {
                        enemyId: other.name,
                        effect: 'slow'
                    }
                }));
            }
            onRemove();
        }
    };

    const restitution = isFireball ? 0.8 : 0;
    const friction = isFireball ? 0.5 : 0;
    const damage = isFireball ? 3 : (isMagicMissile ? 1.5 : 0.5);

    const userData = useMemo(() => ({ damage, type: spell.type }), [damage, spell.type]);

    // Collision Groups
    // Group 2: Projectile
    // Filter: 
    // - Always 0 (World/Enemies)
    // - If FF is ON: Add 1 (Players)
    const collisionMask = friendlyFire ? [0, 1] : [0];

    return (
        <RigidBody
            ref={ref}
            position={spell.position}
            sensor={!isFireball}
            colliders="ball"
            restitution={restitution}
            friction={friction}
            onIntersectionEnter={!isFireball ? handleCollision : undefined}
            onCollisionEnter={isFireball ? handleCollision : undefined}
            gravityScale={isFireball ? 1 : 0}
            name="spell"
            userData={userData}
            collisionGroups={interactionGroups(2, collisionMask)}
        >
            {isMagicMissile ? (
                // Magic Missile Visuals
                <group>
                    <mesh geometry={magicMissileGeometry} material={magicMissileMaterial} />
                    {/* <pointLight color={color} intensity={2} distance={5} decay={2} /> */}
                    {/* <Trail width={0.4} length={8} color={new THREE.Color(color)} attenuation={(t) => t * t} /> */}
                </group>
            ) : (
                // Standard Visuals
                <mesh
                    geometry={isFireball ? fireballGeometry : iceShardGeometry}
                    material={isFireball ? fireballMaterial : iceShardMaterial}
                />
            )}
        </RigidBody >
    );
});

const InstantSpell = ({ spell, color, onRemove, enemiesRef }: any) => {
    const [lightningPoints, setLightningPoints] = useState<THREE.Vector3[]>([]);
    const { scene } = useThree();

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
    }, []); // Run once on mount

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
                            scale={[1, len, 1]} // Scale Y to match length since geometry is height 1
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
};

const AreaSpell = ({ spell, color, onRemove }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.scale.addScalar(delta * 5);
            meshRef.current.rotation.y += delta * 2;
        }
    });

    useEffect(() => {
        const timer = setTimeout(onRemove, 1000);
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
};

const WallSpell = ({ spell, onRemove }: any) => {
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

    return (
        <RigidBody position={spawnPos} rotation={new THREE.Euler().setFromQuaternion(quaternion)} type="fixed">
            <mesh position={[0, height / 2 - 1.5, 0]}>
                <boxGeometry args={[4, height, 1]} />
                <meshStandardMaterial color="#8B4513" roughness={1} />
            </mesh>
        </RigidBody>
    );
};

const EffectSpell = ({ spell, type, onRemove }: any) => {
    useEffect(() => {
        onRemove();
    }, []);

    if (type === 'heal') {
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
};

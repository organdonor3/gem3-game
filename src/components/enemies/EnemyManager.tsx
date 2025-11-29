import { useEffect, useRef } from 'react';
import { isHost, useMultiplayerState } from 'playroomkit';
import { BlobEnemy, FlyingEnemy, TankEnemy, SpeedyEnemy } from '../enemies';

// Define Enemy Data Structure
export interface StatusEffect {
    type: 'slow' | 'fear' | 'lure' | 'grounded' | 'wet' | 'burning' | 'frozen';
    duration: number;
    startTime: number;
    source?: { x: number, y: number, z: number };
    intensity?: number; // 0-1 for slow strength, or damage tier
}

interface EnemyData {
    id: string;
    type: 'blob' | 'flying' | 'tank' | 'speedy';
    position: { x: number, y: number, z: number };
    hp: number;
    speedModifier?: number;
    statusEffects?: StatusEffect[];
}

export const EnemyManager = () => {
    // Shared State for Enemies
    const [enemies, setEnemies] = useMultiplayerState<EnemyData[]>('enemies', []);

    // Ref to access latest enemies in event listener
    const enemiesRef = useRef(enemies);
    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);

    // Host Logic: Spawning & Management
    useEffect(() => {
        const host = isHost();
        if (!host) return;

        // Listen for "spawn-enemy" events from Spawners
        const handleSpawn = (e: any) => {
            const { type, position } = e.detail;
            const newEnemy: EnemyData = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                position,
                hp: getEnemyMaxHp(type),
                speedModifier: 1,
                statusEffects: []
            };

            // Add to state
            const currentEnemies = enemiesRef.current || [];
            setEnemies([...currentEnemies, newEnemy]);
        };

        window.addEventListener('spawn-request', handleSpawn);

        // Listen for "enemy-hit" events
        const handleHit = (e: any) => {
            const { enemyId, damage } = e.detail;

            const currentEnemies = enemiesRef.current || [];
            const updatedEnemies = currentEnemies.map(enemy => {
                if (enemy.id === enemyId) {
                    const newHp = enemy.hp - damage;
                    if (newHp <= 0) {
                        return null;
                    }
                    return { ...enemy, hp: newHp };
                }
                return enemy;
            }).filter(Boolean) as EnemyData[];

            if (currentEnemies.length !== updatedEnemies.length || currentEnemies.some((e, i) => e.hp !== updatedEnemies[i].hp)) {
                setEnemies(updatedEnemies);
            }
        };
        window.addEventListener('enemy-hit', handleHit);

        // Listen for "apply-effect" events
        const handleEffect = (e: any) => {
            const { enemyId, effect, duration, source, intensity } = e.detail;
            const currentEnemies = enemiesRef.current || [];

            const updatedEnemies = currentEnemies.map(enemy => {
                if (enemy.id === enemyId) {
                    const currentEffects = enemy.statusEffects || [];
                    let newEffects = [...currentEffects];

                    const existingIdx = newEffects.findIndex(e => e.type === effect);

                    if (effect === 'slow') {
                        // Stacking Logic for Slow
                        if (existingIdx !== -1) {
                            // Refresh duration and increase intensity
                            const existing = newEffects[existingIdx];
                            const newIntensity = Math.min(0.9, (existing.intensity || 0.1) + (intensity || 0.1));
                            newEffects[existingIdx] = {
                                ...existing,
                                duration: duration || 3000,
                                startTime: Date.now(),
                                intensity: newIntensity
                            };
                        } else {
                            newEffects.push({
                                type: effect,
                                duration: duration || 3000,
                                startTime: Date.now(),
                                intensity: intensity || 0.3 // Default slow 30%
                            });
                        }
                    } else if (effect === 'fear' || effect === 'lure') {
                        // Replace existing (newest source wins)
                        if (existingIdx !== -1) {
                            newEffects[existingIdx] = {
                                type: effect,
                                duration: duration || 2000,
                                startTime: Date.now(),
                                source: source
                            };
                        } else {
                            newEffects.push({
                                type: effect,
                                duration: duration || 2000,
                                startTime: Date.now(),
                                source: source
                            });
                        }
                    } else {
                        // Standard Refresh (Wet, Burning, Grounded, Frozen)
                        if (existingIdx !== -1) {
                            newEffects[existingIdx] = {
                                ...newEffects[existingIdx],
                                duration: duration || 5000,
                                startTime: Date.now()
                            };
                        } else {
                            newEffects.push({
                                type: effect,
                                duration: duration || 5000,
                                startTime: Date.now(),
                                source: source
                            });
                        }
                    }

                    return { ...enemy, statusEffects: newEffects };
                }
                return enemy;
            });
            setEnemies(updatedEnemies);
        };
        window.addEventListener('apply-effect', handleEffect);

        // Cleanup Loop
        const cleanupInterval = setInterval(() => {
            const currentEnemies = enemiesRef.current || [];
            let changed = false;
            const now = Date.now();

            const updatedEnemies = currentEnemies.map(enemy => {
                if (!enemy.statusEffects) return enemy;

                const activeEffects = enemy.statusEffects.filter(e => now - e.startTime < e.duration);

                if (activeEffects.length !== enemy.statusEffects.length) {
                    changed = true;
                    // Reset speed if slow expired? 
                    // Complex if multiple slows. For prototype, if no slow effect, reset speed to 1.
                    let newSpeed = enemy.speedModifier;
                    if (!activeEffects.some(e => e.type === 'slow')) {
                        newSpeed = 1;
                    }
                    return { ...enemy, statusEffects: activeEffects, speedModifier: newSpeed };
                }
                return enemy;
            });

            if (changed) {
                setEnemies(updatedEnemies);
            }
        }, 500);

        return () => {
            window.removeEventListener('spawn-request', handleSpawn);
            window.removeEventListener('enemy-hit', handleHit);
            window.removeEventListener('apply-effect', handleEffect);
            clearInterval(cleanupInterval);
        };
    }, []);

    return (
        <>
            {enemies.map(enemy => (
                <NetworkedEnemy key={enemy.id} data={enemy} />
            ))}
        </>
    );
};

const getEnemyMaxHp = (type: string) => {
    switch (type) {
        case 'tank': return 10;
        case 'speedy': return 1;
        case 'flying': return 2;
        default: return 3; // blob
    }
}

const NetworkedEnemy = ({ data }: { data: EnemyData }) => {
    const pos: [number, number, number] = [data.position.x, data.position.y, data.position.z];

    switch (data.type) {
        case 'blob': return <BlobEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} statusEffects={data.statusEffects} />;
        case 'flying': return <FlyingEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} statusEffects={data.statusEffects} />;
        case 'tank': return <TankEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} statusEffects={data.statusEffects} />;
        case 'speedy': return <SpeedyEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} statusEffects={data.statusEffects} />;
        default: return null;
    }
};

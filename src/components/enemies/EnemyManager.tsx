import { useEffect, useRef } from 'react';
import { isHost, useMultiplayerState } from 'playroomkit';
import { BlobEnemy, FlyingEnemy, TankEnemy, SpeedyEnemy } from '../enemies';

// Define Enemy Data Structure
interface EnemyData {
    id: string;
    type: 'blob' | 'flying' | 'tank' | 'speedy';
    position: { x: number, y: number, z: number };
    hp: number;
    speedModifier?: number;
}

export const EnemyManager = () => {
    // Shared State for Enemies
    const [enemies, setEnemies] = useMultiplayerState<EnemyData[]>('enemies', []);

    // Ref to access latest enemies in event listener
    const enemiesRef = useRef(enemies);
    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);

    // Host Logic: Spawning
    useEffect(() => {
        const host = isHost();
        console.log("Am I host?", host);
        if (!host) return;

        // Listen for "spawn-enemy" events from Spawners
        const handleSpawn = (e: any) => {
            console.log("Spawn request received:", e.detail);
            const { type, position } = e.detail;
            const newEnemy: EnemyData = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                position,
                hp: getEnemyMaxHp(type),
                speedModifier: 1
            };

            // Add to state
            const currentEnemies = enemiesRef.current || [];
            console.log("Adding enemy. Current count:", currentEnemies.length);
            setEnemies([...currentEnemies, newEnemy]);
        };

        window.addEventListener('spawn-request', handleSpawn);

        // Listen for "enemy-hit" events
        const handleHit = (e: any) => {
            const { enemyId, damage } = e.detail;
            console.log(`Enemy ${enemyId} hit for ${damage} damage`);

            const currentEnemies = enemiesRef.current || [];
            const updatedEnemies = currentEnemies.map(enemy => {
                if (enemy.id === enemyId) {
                    const newHp = enemy.hp - damage;
                    if (newHp <= 0) {
                        // Enemy Died
                        // We could spawn particles or drop loot here
                        return null;
                    }
                    return { ...enemy, hp: newHp };
                }
                return enemy;
            }).filter(Boolean) as EnemyData[]; // Remove nulls

            if (currentEnemies.length !== updatedEnemies.length || currentEnemies.some((e, i) => e.hp !== updatedEnemies[i].hp)) {
                setEnemies(updatedEnemies);
            }
        };
        window.addEventListener('enemy-hit', handleHit);

        // Listen for "apply-effect" events
        const handleEffect = (e: any) => {
            const { enemyId, effect } = e.detail;
            if (effect === 'slow') {
                const currentEnemies = enemiesRef.current || [];
                const updatedEnemies = currentEnemies.map(enemy => {
                    if (enemy.id === enemyId) {
                        // Apply Slow (0.5 speed)
                        // In a real game we'd want a timer to revert it, but for now let's just stack it or set it
                        // Let's set it to 0.5 and maybe have a decay logic in a useFrame or interval?
                        // For simplicity: Set to 0.5, and maybe it recovers slowly?
                        // Or just permanent slow for this prototype iteration as requested "stack slow"
                        // "shoot rapidly to stack slow" -> maybe reduce by 0.1 each hit?
                        const newSpeed = Math.max(0.1, (enemy.speedModifier || 1) - 0.1);
                        return { ...enemy, speedModifier: newSpeed };
                    }
                    return enemy;
                });
                setEnemies(updatedEnemies);
            }
        };
        window.addEventListener('apply-effect', handleEffect);

        return () => {
            window.removeEventListener('spawn-request', handleSpawn);
            window.removeEventListener('enemy-hit', handleHit);
            window.removeEventListener('apply-effect', handleEffect);
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
        case 'blob': return <BlobEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} />;
        case 'flying': return <FlyingEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} />;
        case 'tank': return <TankEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} />;
        case 'speedy': return <SpeedyEnemy id={data.id} position={pos} hp={data.hp} speedModifier={data.speedModifier} />;
        default: return null;
    }
};

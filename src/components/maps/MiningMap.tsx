import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { Portal } from '../world/Portal';
import { useMultiplayerState, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { useGameStore } from '../../stores/useGameStore';
import { CrystalFragmentPool } from '../mining/CrystalFragmentPool';
import type { CrystalFragmentPoolHandle } from '../mining/CrystalFragmentPool';
import { Turret } from '../mining/Turret';
import { SweeperHouse } from '../mining/SweeperHouse';
import robotoFont from '../../assets/fonts/roboto.woff';

interface MiningMapProps {
    players: PlayerState[];
}

export const MiningMap = ({ players }: MiningMapProps) => {
    const [_, setGameMode] = useMultiplayerState('gameMode', 'mining');
    const {
        setSpawnPoint,
        triggerRespawn,
        maxCrystalHealth,
        damageCrystal,
        resetCrystal,
        structures,
        addStructure,
        crystalFragments,
        spendCrystalFragments
    } = useGameStore();

    // Sync Crystal Health
    const [syncedCrystalHealth, setSyncedCrystalHealth] = useMultiplayerState('crystalHealth', maxCrystalHealth);

    useEffect(() => {
        // Initial Spawn
        setSpawnPoint([0, 2, 10]);
        triggerRespawn();
        resetCrystal();
    }, []);

    // Fragment Pool Ref
    const poolRef = useRef<CrystalFragmentPoolHandle>(null);

    const spawnFragment = (position: [number, number, number], value: number) => {
        if (poolRef.current) {
            poolRef.current.spawn(position, value);
        }
    };

    // Hit Flash Effect
    const [hitFlash, setHitFlash] = useState(0);
    useFrame((_, delta) => {
        if (hitFlash > 0) {
            setHitFlash(Math.max(0, hitFlash - delta * 5));
        }
    });

    // Use Ref for latest health
    const healthRef = useRef(syncedCrystalHealth);
    useEffect(() => {
        healthRef.current = syncedCrystalHealth;
    }, [syncedCrystalHealth]);

    const handleCrystalHit = (damage: number = 10) => {
        if (healthRef.current > 0) {
            const newHealth = Math.max(0, healthRef.current - damage);
            setSyncedCrystalHealth(newHealth);
            damageCrystal(damage);
            setHitFlash(1);

            // Spawn Fragments from Pool
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                // Random position in upper half of crystal (approx)
                // Crystal center is [0, 5, 0], radius ~8
                // Upper half y: 5 to 10
                const y = 5 + Math.random() * 5;
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 3; // Spread out a bit
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;

                spawnFragment([x, y, z], 1);
            }
        }
    };

    // Listen for "Mine" events
    useEffect(() => {
        const onMine = (e: any) => {
            handleCrystalHit(e.detail.damage);
        };
        window.addEventListener('mine-crystal', onMine);
        return () => window.removeEventListener('mine-crystal', onMine);
    }, []);

    // Building Logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') {
                if (crystalFragments >= 50) {
                    spendCrystalFragments(50);
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 10;
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius;
                    addStructure({ type: 'turret', position: [x, 0, z], owner: myPlayer().id });
                }
            } else if (e.key === '2') {
                if (crystalFragments >= 100) {
                    spendCrystalFragments(100);
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 15;
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius;
                    addStructure({ type: 'sweeper_house', position: [x, 0, z], owner: myPlayer().id });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [crystalFragments]);

    return (
        <>
            {/* Floor */}
            <RigidBody type="fixed" friction={1}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#222" roughness={0.8} />
                </mesh>
                <gridHelper args={[100, 100, 0x555555, 0x222222]} position={[0, 0.01, 0]} />
            </RigidBody>

            {/* Central Crystal */}
            <RigidBody type="fixed" colliders="hull">
                <group position={[0, 5, 0]}>
                    <mesh castShadow receiveShadow>
                        <octahedronGeometry args={[8, 0]} />
                        <meshStandardMaterial
                            color={hitFlash > 0 ? "white" : "#00ffff"}
                            emissive="#00ffff"
                            emissiveIntensity={(syncedCrystalHealth / maxCrystalHealth * 3) + (hitFlash * 5)}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                    <pointLight color="#00ffff" intensity={10} distance={20} />
                </group>
            </RigidBody>

            {/* Fragment Pool */}
            <CrystalFragmentPool ref={poolRef} count={30} />

            {/* Structures */}
            {structures.map((s: any, i: number) => {
                if (s.type === 'turret') {
                    return <Turret key={i} position={s.position} level={s.level} ownerId={s.owner} />;
                } else if (s.type === 'sweeper_house') {
                    return <SweeperHouse key={i} position={s.position} level={s.level} ownerId={s.owner} fragments={[]} />;
                }
                return null;
            })}

            {/* HP Bar */}
            <Text position={[0, 5, 0]} fontSize={1} color="white" anchorX="center" font={robotoFont}>
                {`Crystal HP: ${syncedCrystalHealth} / ${maxCrystalHealth}`}
            </Text>

            {/* Victory Screen */}
            {syncedCrystalHealth <= 0 && (
                <group position={[0, 5, 5]}>
                    <Text fontSize={3} color="gold" anchorX="center" outlineWidth={0.2} outlineColor="black" font={robotoFont}>
                        VICTORY!
                    </Text>
                    <Text position={[0, -2, 0]} fontSize={1} color="white" anchorX="center" font={robotoFont}>
                        Crystal Destroyed!
                    </Text>
                </group>
            )}

            {/* Portal back to Lobby */}
            <Portal
                position={[0, 1, -15]}
                targetMode="lobby"
                players={players}
                onTeleport={() => setGameMode('lobby')}
            />
        </>
    );
};

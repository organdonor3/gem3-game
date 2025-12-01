import { useState, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { Portal } from '../world/Portal';
import { useMultiplayerState, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { FireHazard } from '../world/FireHazard';
import { useGameStore } from '../../stores/useGameStore';
import robotoFont from '../../assets/fonts/roboto.woff';

interface ParkourMapProps {
    players: PlayerState[];
}

export const ParkourMap = ({ players }: ParkourMapProps) => {
    const [_, setGameMode] = useMultiplayerState('gameMode', 'parkour');
    const { setSpawnPoint, triggerRespawn } = useGameStore();

    // Checkpoint System
    const [_lastCheckpoint, setLastCheckpoint] = useState<[number, number, number]>([0, 2, 0]);
    const [startTime] = useState(Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        setSpawnPoint([0, 2, 0]); // Initial Parkour Spawn
        triggerRespawn();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!finished) {
                setElapsed((Date.now() - startTime) / 1000);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [startTime, finished]);

    const handleCheckpoint = (pos: [number, number, number]) => {
        setLastCheckpoint(pos);
        setSpawnPoint(pos); // Update global spawn point
    };

    const handleVoidFall = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer()?.id) {
            triggerRespawn();
        }
    };

    return (
        <>
            {/* Timer UI */}
            <Text position={[0, 10, 0]} fontSize={1} color="white" anchorX="center" anchorY="bottom" font={robotoFont}>
                Time: {elapsed.toFixed(1)}s
            </Text>

            {/* Void Floor (Kill/Respawn Zone) */}
            <RigidBody type="fixed" sensor position={[0, -10, 0]} onIntersectionEnter={handleVoidFall}>
                <CuboidCollider args={[100, 1, 100]} />
            </RigidBody>

            {/* Starting Platform */}
            <RigidBody type="fixed" position={[0, 0, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[10, 1, 10]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>

            {/* Portal back to Lobby */}
            <Portal
                position={[0, 1, -3]}
                targetMode="lobby"
                players={players}
                onTeleport={() => setGameMode('lobby')}
            />

            {/* Parkour Course */}

            {/* Step 1: Simple Jumps */}
            <RigidBody type="fixed" position={[0, 2, 10]}>
                <mesh receiveShadow>
                    <boxGeometry args={[3, 0.5, 3]} />
                    <meshStandardMaterial color="#666" />
                </mesh>
            </RigidBody>
            {/* Checkpoint 1 */}
            <CuboidCollider
                position={[0, 3, 10]}
                args={[1.5, 1, 1.5]}
                sensor
                onIntersectionEnter={(e) => {
                    if (e.other.rigidBodyObject?.userData?.id === myPlayer()?.id) handleCheckpoint([0, 4, 10]);
                }}
            />

            <RigidBody type="fixed" position={[0, 4, 18]}>
                <mesh receiveShadow>
                    <boxGeometry args={[3, 0.5, 3]} />
                    <meshStandardMaterial color="#666" />
                </mesh>
            </RigidBody>

            {/* Step 2: Moving Platform (Simulated with simple physics or just static for now) */}
            <RigidBody type="fixed" position={[0, 6, 26]}>
                <mesh receiveShadow>
                    <boxGeometry args={[2, 0.5, 6]} />
                    <meshStandardMaterial color="#888" />
                </mesh>
            </RigidBody>

            {/* Hazard Jump */}
            <FireHazard position={[0, 6, 35]} size={[5, 1, 5]} />
            <RigidBody type="fixed" position={[0, 8, 35]}>
                <mesh receiveShadow>
                    <boxGeometry args={[2, 0.5, 2]} />
                    <meshStandardMaterial color="#aaa" />
                </mesh>
            </RigidBody>
            {/* Checkpoint 2 */}
            <CuboidCollider
                position={[0, 9, 35]}
                args={[1, 1, 1]}
                sensor
                onIntersectionEnter={(e) => {
                    if (e.other.rigidBodyObject?.userData?.id === myPlayer()?.id) handleCheckpoint([0, 10, 35]);
                }}
            />

            {/* The Top */}
            <RigidBody type="fixed" position={[0, 15, 50]}>
                <mesh receiveShadow>
                    <boxGeometry args={[10, 1, 10]} />
                    <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
                </mesh>
            </RigidBody>

            {/* Finish Line */}
            <CuboidCollider
                position={[0, 16, 50]}
                args={[5, 2, 5]}
                sensor
                onIntersectionEnter={(e) => {
                    if (e.other.rigidBodyObject?.userData?.id === myPlayer()?.id) setFinished(true);
                }}
            />

            <Text position={[0, 18, 50]} fontSize={2} color="gold" font={robotoFont}>
                {finished ? `FINISHED! Time: ${elapsed.toFixed(2)}s` : "VICTORY!"}
            </Text>

        </>
    );
};

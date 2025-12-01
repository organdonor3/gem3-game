import { useState, useEffect, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { Portal } from '../world/Portal';
import { ButtonPad } from '../world/ButtonPad';
import { PlayerMotherShip } from '../game/PlayerMotherShip';
import { useMultiplayerState, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { useGameStore } from '../../stores/useGameStore';
import robotoFont from '../../assets/fonts/roboto.woff';


interface CollectorMapProps {
    players: PlayerState[];
}

export const CollectorMap = ({ players }: CollectorMapProps) => {
    const [_, setGameMode] = useMultiplayerState('gameMode', 'collector');
    const { setSpawnPoint, triggerRespawn, playerScores, resetScores } = useGameStore();

    // Timer
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameOver, setGameOver] = useState(false);

    // Ship States (Synced via Playroom)
    const [shipVelocities, setShipVelocities] = useMultiplayerState('shipVelocities', {} as Record<string, { x: number, z: number }>);

    // Local input state for hold-to-move
    const [activeButtons, setActiveButtons] = useState<{ up: boolean; right: boolean }>({ up: false, right: false });

    useEffect(() => {
        // Reset Scores on Start
        resetScores();

        // Set Spawn Points (Corners)
        // We'll spawn players on a platform in their corner
        const myId = myPlayer()?.id || "0";
        const index = players.findIndex(p => p.id === myId);
        const corner = getCorner(index);
        setSpawnPoint([corner[0], 5, corner[2]]);
        triggerRespawn();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameOver) {
                const elapsed = (Date.now() - startTime) / 1000;
                const remaining = Math.max(0, 60 - elapsed);
                setTimeLeft(remaining);
                if (remaining <= 0) setGameOver(true);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [startTime, gameOver]);

    // Continuous Movement Logic
    // Ref to hold latest shipVelocities to avoid dependency cycles
    const shipVelocitiesRef = useRef(shipVelocities);
    useEffect(() => {
        shipVelocitiesRef.current = shipVelocities;
    }, [shipVelocities]);

    // Movement Logic - Triggered by button state changes
    useEffect(() => {
        const myId = myPlayer()?.id;
        if (!myId) return;

        let targetVel = { x: 0, z: 0 };
        const speed = 8;

        if (activeButtons.up) targetVel.z = -speed;
        if (activeButtons.right) targetVel.x = speed;

        // Check against latest ref value
        const velocities = shipVelocitiesRef.current;
        const currentVel = velocities[myId] || { x: 0, z: 0 };

        if (currentVel.x !== targetVel.x || currentVel.z !== targetVel.z) {
            setShipVelocities({
                ...velocities,
                [myId]: targetVel
            });
        }
    }, [activeButtons, setShipVelocities]);

    const getCorner = (index: number): [number, number, number] => {
        const corners = [
            [20, 0, 20],   // Top Right
            [-20, 0, 20],  // Top Left
            [20, 0, -20],  // Bottom Right
            [-20, 0, -20]  // Bottom Left
        ];
        return corners[index % 4] as [number, number, number];
    };

    const handleButtonChange = (btn: 'up' | 'right', pressed: boolean) => {
        setActiveButtons(prev => ({ ...prev, [btn]: pressed }));
    };

    return (
        <>
            {/* Floor */}
            <RigidBody type="fixed" friction={1}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#111" roughness={0.1} metalness={0.5} />
                </mesh>
                <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, 0.01, 0]} />
            </RigidBody>

            {/* Timer & Score UI */}
            <Text position={[0, 10, -10]} fontSize={2} color="white" anchorX="center" anchorY="bottom" font={robotoFont}>
                {gameOver ? "GAME OVER" : `Time: ${timeLeft.toFixed(1)}s`}
            </Text>

            {/* Player Stations */}
            {players.map((player, i) => {
                const corner = getCorner(i);
                const isMe = player.id === myPlayer()?.id;
                const velocities = shipVelocities as Record<string, { x: number, z: number }>;
                const vel = velocities[player.id] || { x: 0, z: 0 };
                const color = (player.getProfile().color.hex || "#ffffff") as string;

                return (
                    <group key={player.id} position={[corner[0], 0, corner[2]]}>
                        {/* Platform */}
                        <RigidBody type="fixed">
                            <mesh position={[0, 0.5, 0]} receiveShadow>
                                <boxGeometry args={[8, 1, 8]} />
                                <meshStandardMaterial color={color} />
                            </mesh>
                        </RigidBody>

                        {/* Buttons */}
                        <ButtonPad
                            position={[2, 1.1, 2]}
                            label="RIGHT"
                            color="blue"
                            onPressStart={() => isMe && handleButtonChange('right', true)}
                            onPressEnd={() => isMe && handleButtonChange('right', false)}
                        />
                        <ButtonPad
                            position={[-2, 1.1, 2]}
                            label="UP"
                            color="green"
                            onPressStart={() => isMe && handleButtonChange('up', true)}
                            onPressEnd={() => isMe && handleButtonChange('up', false)}
                        />

                        {/* Ship - Lowered Spawn Height to y=3 */}
                        <PlayerMotherShip
                            playerId={player.id}
                            position={[corner[0], 3, corner[2]]}
                            color={color}
                            velocity={[vel.x, 0, vel.z]}
                        />

                        {/* Score Display */}
                        <Text position={[0, 5, 0]} fontSize={1} color="white" font={robotoFont}>
                            Score: {playerScores[player.id] || 0}
                        </Text>
                    </group>
                );
            })}

            {/* Enemies - Added Damping */}
            {Array.from({ length: 20 }).map((_, i) => (
                <RigidBody
                    key={i}
                    position={[(Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40]}
                    userData={{ tag: 'enemy', id: `enemy-${i}` }}
                    linearDamping={5}
                    angularDamping={5}
                    mass={5}
                >
                    <mesh castShadow>
                        <sphereGeometry args={[0.5]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                </RigidBody>
            ))}

            {/* Portal back to Lobby */}
            <Portal
                position={[0, 1, 0]}
                targetMode="lobby"
                players={players}
                onTeleport={() => setGameMode('lobby')}
            />
        </>
    );
};

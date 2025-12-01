import { useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { SpellTome, ManaPad, SpawnPillar, TogglePad, FireHazard } from '../world';
import { EnemySpawner, EnemyManager } from '../enemies';
import { MotherShip } from '../enemies/MotherShip';
import { Portal } from '../world/Portal';
import { useMultiplayerState, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { useGameStore } from '../../stores/useGameStore';

interface LobbyMapProps {
    players: PlayerState[];
}

export const LobbyMap = ({ players }: LobbyMapProps) => {
    const { isMotherShipActive, setMotherShipActive, friendlyFire, toggleFriendlyFire, setSpawnPoint, triggerRespawn } = useGameStore();
    const [_, setGameMode] = useMultiplayerState('gameMode', 'lobby');

    useEffect(() => {
        // Calculate Spawn Point (Pillar)
        const myId = myPlayer()?.id || "0";
        const spawnIndex = parseInt(myId.substr(0, 1), 36) % 4;
        const spawnPositions = [
            [20, 6, 20],   // Red Pillar
            [-20, 6, 20],  // Blue Pillar
            [20, 6, -20],  // Green Pillar
            [-20, 6, -20]  // Yellow Pillar
        ];
        const myPillar = spawnPositions[spawnIndex] as [number, number, number];

        setSpawnPoint(myPillar);
        triggerRespawn();
    }, []);

    return (
        <>
            {/* Floor */}
            <RigidBody type="fixed" friction={1}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.5} />
                </mesh>
                <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, 0.01, 0]} />
            </RigidBody>

            {/* Spell Tomes */}
            <SpellTome position={[5, 1, 5]} spell="fireball" color="orange" />
            <SpellTome position={[-5, 1, 5]} spell="lightning" color="yellow" />
            <SpellTome position={[5, 1, -5]} spell="ice_shard" color="cyan" />
            <SpellTome position={[-5, 1, -5]} spell="magic_missile" color="purple" />
            <SpellTome position={[0, 1, 8]} spell="wind_blast" color="white" />

            {/* New Spells */}
            <SpellTome position={[0, 1, -8]} spell="water_gun" color="blue" />
            <SpellTome position={[8, 1, 0]} spell="bait_ball" color="pink" />
            <SpellTome position={[-8, 1, 0]} spell="net_projectile" color="green" />
            <SpellTome position={[8, 1, 8]} spell="summon_cage" color="brown" />
            <SpellTome position={[-8, 1, 8]} spell="shout" color="gold" />

            {/* Mana Pad */}
            <ManaPad position={[0, 0, 0]} />

            {/* Spawn Pillars */}
            <SpawnPillar position={[20, 0, 20]} color="red" />
            <SpawnPillar position={[-20, 0, 20]} color="blue" />
            <SpawnPillar position={[20, 0, -20]} color="green" />
            <SpawnPillar position={[-20, 0, -20]} color="yellow" />

            {/* Settings Pads */}
            <TogglePad
                position={[0, 0, 15]}
                settingName="Friendly Fire"
                value={friendlyFire}
                onToggle={toggleFriendlyFire}
            />
            <TogglePad
                position={[5, 0, 15]}
                settingName="Mother Ship"
                value={isMotherShipActive}
                onToggle={() => setMotherShipActive(!isMotherShipActive)}
            />

            {/* Mother Ship Boss */}
            <MotherShip />

            {/* Fire Hazards & Platforms */}
            <FireHazard position={[15, 0.01, 0]} size={[8, 1, 8]} />
            <RigidBody type="fixed" position={[15, 2, 0]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[10, 0.2, 2]} />
                    <meshStandardMaterial color="#444" roughness={0.8} />
                </mesh>
            </RigidBody>

            <FireHazard position={[-15, 0.01, 0]} size={[8, 1, 8]} />
            <RigidBody type="fixed" position={[-15, 2, 0]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[10, 0.2, 2]} />
                    <meshStandardMaterial color="#444" roughness={0.8} />
                </mesh>
            </RigidBody>

            {/* Enemy Spawners */}
            <EnemySpawner position={[10, 0.1, 10]} type="blob" />
            <EnemySpawner position={[-10, 0.1, -10]} type="flying" />
            <EnemySpawner position={[10, 0.1, -10]} type="tank" />
            <EnemySpawner position={[-10, 0.1, 10]} type="speedy" />

            <EnemyManager />

            {/* Portal to Parkour Mode */}
            <Portal
                position={[0, 0, -15]}
                targetMode="parkour"
                players={players}
                onTeleport={() => setGameMode('parkour')}
            />

            {/* Portal to Collector Mode */}
            <Portal
                position={[15, 0, 0]}
                targetMode="collector"
                players={players}
                onTeleport={() => setGameMode('collector')}
            />

            {/* Portal to Mining Mode */}
            <Portal
                position={[-15, 0, 0]}
                targetMode="mining"
                players={players}
                onTeleport={() => setGameMode('mining')}
            />
        </>
    );
};

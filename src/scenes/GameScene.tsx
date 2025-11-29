import { useState, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { onPlayerJoin, useMultiplayerState } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { PlayerController } from '../components/game/PlayerController';
import { SpellTome } from '../components/world';
import { SpellManager } from '../components/spells/SpellManager';
import { EnemySpawner } from '../components/enemies/EnemySpawner';
import { EnemyManager } from '../components/enemies/EnemyManager';
import { CameraController } from '../components/game/CameraController';
import { ManaPad } from '../components/world/ManaPad';
import { SpawnPillar } from '../components/world/SpawnPillar';
import { TogglePad } from '../components/world/TogglePad';
import { useGameStore } from '../stores/useGameStore';
import { GlobalPrewarmer } from '../components/systems/GlobalPrewarmer';
import { FireHazard } from '../components/world/FireHazard';
import { MotherShip } from '../components/enemies/MotherShip';

export const GameScene = () => {
    const [players, setPlayers] = useState<PlayerState[]>([]);

    // Manage Player List
    useEffect(() => {
        onPlayerJoin((state) => {
            setPlayers((current) => [...current, state]);

            state.onQuit(() => {
                setPlayers((current) => current.filter((p) => p.id !== state.id));
            });
        });
    }, []);

    // --- GLOBAL SETTINGS SYNC ---
    const [friendlyFire, setFriendlyFire] = useMultiplayerState('friendlyFire', false);

    // Sync Network State -> Local Store
    useEffect(() => {
        useGameStore.setState({ friendlyFire });
    }, [friendlyFire]);

    const [isMotherShipActive, setMotherShipActive] = useMultiplayerState('isMotherShipActive', false);

    useEffect(() => {
        useGameStore.setState({ isMotherShipActive });
    }, [isMotherShipActive]);

    return (
        <>
            <color attach="background" args={['#111']} />

            {/* Lighting & Environment */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <Environment preset="city" />

            {/* Floor */}
            <RigidBody type="fixed" friction={1}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.5} />
                </mesh>
                <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, 0.01, 0]} />
            </RigidBody>

            {/* --- Robot Spellcaster Arena --- */}

            {/* Spell Manager */}
            <GlobalPrewarmer />
            <SpellManager />

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
                onToggle={() => setFriendlyFire(!friendlyFire)}
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
            {/* Hazard 1 */}
            <FireHazard position={[15, 0.01, 0]} size={[8, 1, 8]} />
            <RigidBody type="fixed" position={[15, 2, 0]}>
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[10, 0.2, 2]} />
                    <meshStandardMaterial color="#444" roughness={0.8} />
                </mesh>
            </RigidBody>

            {/* Hazard 2 */}
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

            {/* Render All Players (Local + Remote) */}
            {players.map((player) => (
                <PlayerController key={player.id} player={player} />
            ))}

            {/* Network Debug Removed */}

            <CameraController />

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={1.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </>
    );
};

import { useState, useEffect } from 'react';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { onPlayerJoin, useMultiplayerState } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { PlayerController } from '../components/game/PlayerController';
import { CameraController } from '../components/game/CameraController';
import { useGameStore } from '../stores/useGameStore';
import { LobbyMap, ParkourMap } from '../components/maps';
import { CollectorMap } from '../components/maps/CollectorMap';
import { MiningMap } from '../components/maps/MiningMap';

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
    const [friendlyFire, _setFriendlyFire] = useMultiplayerState('friendlyFire', false);
    const [isMotherShipActive, _setMotherShipActive] = useMultiplayerState('isMotherShipActive', false);
    const [gameMode, _setGameMode] = useMultiplayerState('gameMode', 'lobby');

    // Sync Network State -> Local Store
    useEffect(() => {
        useGameStore.setState({ friendlyFire, isMotherShipActive, gameMode: gameMode as 'lobby' | 'parkour' | 'collector' });
    }, [friendlyFire, isMotherShipActive, gameMode]);

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

            {/* --- Game Modes --- */}
            {gameMode === 'lobby' && <LobbyMap players={players} />}
            {gameMode === 'parkour' && <ParkourMap players={players} />}
            {gameMode === 'collector' && <CollectorMap players={players} />}
            {gameMode === 'mining' && <MiningMap players={players} />}

            {/* Render All Players (Local + Remote) */}
            {players.map((player) => (
                <PlayerController key={player.id} player={player} />
            ))}

            <CameraController />

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={1.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </>
    );
};

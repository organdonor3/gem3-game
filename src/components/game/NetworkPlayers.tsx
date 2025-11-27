import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { onPlayerJoin } from "playroomkit";
import type { PlayerState } from "playroomkit";
import * as THREE from "three";

export const NetworkPlayers = () => {
    const [players, setPlayers] = useState<PlayerState[]>([]);

    useEffect(() => {
        onPlayerJoin((state) => {
            setPlayers((p) => [...p, state]);

            state.onQuit(() => {
                setPlayers((p) => p.filter((player) => player.id !== state.id));
            });
        });
    }, []);

    return (
        <>
            {players.map((player) => (
                <NetworkPlayer key={player.id} player={player} />
            ))}
        </>
    );
};

const NetworkPlayer = ({ player }: { player: PlayerState }) => {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!ref.current) return;

        // Get state from Playroom
        const pos = player.getState("pos");
        if (pos) {
            // Simple interpolation could go here
            ref.current.position.set(pos.x, pos.y, pos.z);
        }

        // Color
        const color = player.getProfile().color.hex;
        if (ref.current.material instanceof THREE.MeshStandardMaterial) {
            ref.current.material.color.set(color);
        }
    });

    return (
        <mesh ref={ref} castShadow>
            <capsuleGeometry args={[0.5, 1, 4, 8]} />
            <meshStandardMaterial />
        </mesh>
    );
};

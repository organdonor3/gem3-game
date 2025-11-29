import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { usePlayersList, myPlayer } from "playroomkit";
import type { PlayerState } from "playroomkit";
import * as THREE from "three";
import { PlayerModel } from "./PlayerModel";

export const NetworkPlayers = () => {
    const players = usePlayersList(true); // Get all players
    const otherPlayers = players.filter(p => p.id !== myPlayer().id);

    return (
        <>
            {otherPlayers.map((player) => (
                <NetworkPlayer key={player.id} player={player} />
            ))}
        </>
    );
};

const NetworkPlayer = ({ player }: { player: PlayerState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetPos = useRef(new THREE.Vector3(0, 10, 0));
    const targetRot = useRef(new THREE.Quaternion());

    // Animation State
    const [animState, setAnimState] = useState({
        isMoving: false,
        isJumping: false,
        isJetpacking: false
    });

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Get state from Playroom
        const pos = player.getState("pos");
        const rot = player.getState("rot");
        const anim = player.getState("anim");

        if (pos) {
            targetPos.current.set(pos.x, pos.y, pos.z);
        }
        if (rot) {
            targetRot.current.set(rot._x, rot._y, rot._z, rot._w);
        }
        if (anim) {
            setAnimState(anim);
        }

        // Smoothly interpolate
        groupRef.current.position.lerp(targetPos.current, 15 * delta);
        groupRef.current.quaternion.slerp(targetRot.current, 15 * delta);
    });

    const profile = player.getProfile();
    const color = (profile?.color?.hex || "#ffffff") as string;

    return (
        <group ref={groupRef}>
            <group position={[0, -0.5, 0]}>
                <PlayerModel
                    color={color}
                    isMoving={animState.isMoving}
                    isJumping={animState.isJumping}
                    isJetpacking={animState.isJetpacking}
                />
            </group>
        </group>
    );
};

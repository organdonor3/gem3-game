import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../../stores/useGameStore";
import { myPlayer } from "playroomkit";

export const ManaPad = ({ position }: { position: [number, number, number] }) => {
    const { mana, maxMana, addMana } = useGameStore();
    const isLocalPlayerOnPad = useRef(false);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        // Pulsating Effect
        if (materialRef.current) {
            const time = state.clock.getElapsedTime();
            if (active) {
                materialRef.current.emissiveIntensity = 2 + Math.sin(time * 10) * 0.5;
                materialRef.current.color.setHex(0x00FFFF);
            } else {
                materialRef.current.emissiveIntensity = 0.5;
                materialRef.current.color.setHex(0x00008B); // Dark Blue
            }
        }

        // Regen Logic
        if (isLocalPlayerOnPad.current) {
            if (mana < maxMana) {
                addMana(delta * 50);
            }
        }
    });

    const handleIntersectionEnter = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer().id) {
            isLocalPlayerOnPad.current = true;
            setActive(true);
        }
    };

    const handleIntersectionExit = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer().id) {
            isLocalPlayerOnPad.current = false;
            setActive(false);
        }
    };

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false}>
                {/* --- PHYSICAL BASE (Solid) --- */}
                {/* Matches SpawnPillar dimensions roughly but shorter or distinct */}
                <CylinderCollider args={[1.0, 3]} position={[0, 1, 0]} />

                <mesh position={[0, 1, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[3, 3.5, 2, 8]} />
                    <meshStandardMaterial color="#2F4F4F" roughness={0.8} />
                </mesh>

                {/* Platform Top */}
                <mesh position={[0, 2.1, 0]} receiveShadow>
                    <cylinderGeometry args={[2.8, 2.8, 0.2, 8]} />
                    <meshStandardMaterial ref={materialRef} color="#00008B" emissive="#00BFFF" emissiveIntensity={0.5} />
                </mesh>

                {/* --- SENSOR (Trigger) --- */}
                {/* Sits on top of the platform to catch the player's feet */}
                <CylinderCollider
                    args={[1.5, 2.5]} // Height 1.5 (Total 3), Radius 2.5
                    position={[0, 3.5, 0]} // Center at y=3.5 (extends from 2 to 5)
                    sensor
                    onIntersectionEnter={handleIntersectionEnter}
                    onIntersectionExit={handleIntersectionExit}
                />
            </RigidBody>
        </group>
    );
};

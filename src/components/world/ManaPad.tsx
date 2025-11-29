import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../../stores/useGameStore";
import { myPlayer } from "playroomkit";

export const ManaPad = ({ position }: { position: [number, number, number] }) => {
    const { mana, maxMana, setMana } = useGameStore();
    const isLocalPlayerOnPad = useRef(false);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state) => {
        // Pulsating Effect
        if (materialRef.current) {
            const time = state.clock.getElapsedTime();
            materialRef.current.emissiveIntensity = 1 + Math.sin(time * 3) * 0.5;
        }

        // Regen Logic
        if (isLocalPlayerOnPad.current) {
            if (mana < maxMana) {
                setMana(Math.min(maxMana, mana + 1)); // Fast regen: 60 mana/sec
            }
        }
    });

    const handleIntersectionEnter = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer().id) {
            isLocalPlayerOnPad.current = true;
        }
    };

    const handleIntersectionExit = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer().id) {
            isLocalPlayerOnPad.current = false;
        }
    };

    return (
        <group position={position}>
            <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersectionEnter} onIntersectionExit={handleIntersectionExit}>
                <CylinderCollider args={[0.2, 3]} />
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[3, 3, 0.2, 32]} />
                    <meshStandardMaterial ref={materialRef} color="#00BFFF" emissive="#00BFFF" emissiveIntensity={1} transparent opacity={0.8} />
                </mesh>
                {/* Floating Particles/Rings Visuals */}
                <mesh position={[0, 1, 0]}>
                    <ringGeometry args={[2.5, 2.8, 32]} />
                    <meshBasicMaterial color="#E0FFFF" side={THREE.DoubleSide} transparent opacity={0.5} />
                </mesh>
            </RigidBody>
        </group>
    );
};

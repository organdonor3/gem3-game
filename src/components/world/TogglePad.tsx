import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { myPlayer } from "playroomkit";

interface TogglePadProps {
    position: [number, number, number];
    settingName: string;
    value: boolean;
    onToggle: () => void;
}

export const TogglePad = ({ position, settingName, value, onToggle }: TogglePadProps) => {
    const isLocalPlayerOnPad = useRef(false);
    const progress = useRef(0);
    const [_, setActive] = useState(false);

    // Visual Refs
    const ringRef = useRef<THREE.Mesh>(null);
    const textRef = useRef<any>(null);

    useFrame((_state, delta) => {
        // Progress Logic
        if (isLocalPlayerOnPad.current) {
            progress.current = Math.min(3, progress.current + delta);
            if (progress.current >= 3) {
                onToggle();
                progress.current = 0; // Reset after toggle
            }
        } else {
            progress.current = Math.max(0, progress.current - delta * 2); // Decay faster
        }

        // Visual Updates
        if (ringRef.current) {
            const progressRatio = progress.current / 3;
            // Scale ring based on progress
            ringRef.current.scale.setScalar(1 + progressRatio * 0.5);

            // Color based on active state + progress
            const baseColor = value ? new THREE.Color("#00ff00") : new THREE.Color("#ff0000");
            const emissiveColor = baseColor.clone().multiplyScalar(1 + progressRatio * 2);

            (ringRef.current.material as THREE.MeshStandardMaterial).color = baseColor;
            (ringRef.current.material as THREE.MeshStandardMaterial).emissive = emissiveColor;
            (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = value ? 2 : 0.5;
        }
    });

    const handleIntersectionEnter = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer()?.id) {
            isLocalPlayerOnPad.current = true;
            setActive(true);
        }
    };

    const handleIntersectionExit = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer()?.id) {
            isLocalPlayerOnPad.current = false;
            setActive(false);
            progress.current = 0; // Reset immediately on exit? Or let it decay? Let's decay.
        }
    };

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false}>
                {/* Base */}
                <mesh position={[0, 0.1, 0]} receiveShadow>
                    <cylinderGeometry args={[1.5, 1.8, 0.2, 32]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Progress Ring */}
                <mesh ref={ringRef} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.0, 1.2, 32]} />
                    <meshStandardMaterial color={value ? "#00ff00" : "#ff0000"} />
                </mesh>

                {/* Text Label */}
                <Text
                    ref={textRef}
                    position={[0, 1.5, 0]}
                    fontSize={0.4}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="black"
                >
                    {settingName}
                    {'\n'}
                    {value ? "ON" : "OFF"}
                </Text>

                {/* Sensor */}
                <CylinderCollider
                    args={[1.0, 1.5]}
                    position={[0, 1, 0]}
                    sensor
                    onIntersectionEnter={handleIntersectionEnter}
                    onIntersectionExit={handleIntersectionExit}
                />
            </RigidBody>
        </group>
    );
};

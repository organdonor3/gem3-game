import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { myPlayer } from "playroomkit";
import robotoFont from '../../assets/fonts/roboto.woff';

interface ButtonPadProps {
    position: [number, number, number];
    label: string;
    color?: string;
    onPressStart: () => void;
    onPressEnd: () => void;
}

export const ButtonPad = ({ position, label, color = "red", onPressStart, onPressEnd }: ButtonPadProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const buttonRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (buttonRef.current) {
            const targetY = isPressed ? 0.05 : 0.2;
            buttonRef.current.position.y = THREE.MathUtils.lerp(buttonRef.current.position.y, targetY, delta * 20);
        }
    });

    const handleIntersectionEnter = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer()?.id) {
            setIsPressed(true);
            onPressStart();
        }
    };

    const handleIntersectionExit = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player' && other.userData?.id === myPlayer()?.id) {
            setIsPressed(false);
            onPressEnd();
        }
    };

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false}>
                {/* Base */}
                <mesh position={[0, 0.05, 0]} receiveShadow>
                    <cylinderGeometry args={[1.2, 1.4, 0.1, 32]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Button */}
                <mesh ref={buttonRef} position={[0, 0.2, 0]} receiveShadow castShadow>
                    <cylinderGeometry args={[1, 1, 0.2, 32]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isPressed ? 0.5 : 0.1} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, 0.4, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font={robotoFont}
                >
                    {label}
                </Text>

                {/* Sensor */}
                <CylinderCollider
                    args={[0.5, 1]}
                    position={[0, 0.5, 0]}
                    sensor
                    onIntersectionEnter={handleIntersectionEnter}
                    onIntersectionExit={handleIntersectionExit}
                />
            </RigidBody>
        </group>
    );
};

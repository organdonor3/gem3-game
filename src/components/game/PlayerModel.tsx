import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlayerModelProps {
    color: string;
    isMoving?: boolean;
    isJumping?: boolean;
    isJetpacking?: boolean;
    cooldown?: number;
    manaRatio?: number;
    hpRatio?: number;
}

export const PlayerModel = ({
    color,
    isMoving,
    isJumping,
    isJetpacking,

    manaRatio = 1,
    hpRatio = 1,
}: PlayerModelProps) => {
    const group = useRef<THREE.Group>(null);
    const leftArm = useRef<THREE.Group>(null);
    const rightArm = useRef<THREE.Group>(null);
    const leftLeg = useRef<THREE.Group>(null);
    const rightLeg = useRef<THREE.Group>(null);
    const jetpack = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!group.current) return;

        const time = state.clock.elapsedTime;

        // Bobbing animation
        const bobOffset = isMoving ? Math.sin(time * 15) * 0.05 : Math.sin(time * 2) * 0.02;
        group.current.position.y = bobOffset;

        // Limb Animation
        if (isJumping || isJetpacking) {
            // Jump / Fly Pose
            // Arms slightly up/out
            if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.5, 0.2);
            if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0.5, 0.2);

            // Legs bent back slightly
            if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, -0.2, 0.2);
            if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, -0.4, 0.2);
        } else if (isMoving) {
            if (leftArm.current) leftArm.current.rotation.x = Math.sin(time * 15) * 0.5;
            if (rightArm.current) rightArm.current.rotation.x = Math.sin(time * 15 + Math.PI) * 0.5;
            if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(time * 15 + Math.PI) * 0.5;
            if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(time * 15) * 0.5;
        } else {
            // Idle Pose
            if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, 0.1);
            if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, 0.1);
            if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1);
            if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1);
        }

        // Jetpack Tilt
        if (isJetpacking && group.current) {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.2, 0.1);
        } else if (group.current) {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        }
    });

    return (
        <group ref={group}>
            {/* --- ROBOT BODY --- */}

            {/* Torso */}
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.6, 0.3]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Head */}
            <group position={[0, 1.1, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.35, 0.35, 0.35]} />
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Visor */}
                <mesh position={[0, 0, 0.15]}>
                    <boxGeometry args={[0.25, 0.1, 0.1]} />
                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                </mesh>
                {/* Antenna */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                    <meshStandardMaterial color="gray" />
                </mesh>
            </group>

            {/* Arms */}
            <group ref={leftArm} position={[-0.35, 0.9, 0]}>
                <mesh position={[0, -0.25, 0]} castShadow>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    <meshStandardMaterial color="gray" metalness={0.5} />
                </mesh>
            </group>
            <group ref={rightArm} position={[0.35, 0.9, 0]}>
                <mesh position={[0, -0.25, 0]} castShadow>
                    <boxGeometry args={[0.15, 0.5, 0.15]} />
                    <meshStandardMaterial color="gray" metalness={0.5} />
                </mesh>
            </group>

            {/* Legs */}
            <group ref={leftLeg} position={[-0.15, 0.4, 0]}>
                <mesh position={[0, -0.3, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.6, 0.18]} />
                    <meshStandardMaterial color="gray" metalness={0.5} />
                </mesh>
            </group>
            <group ref={rightLeg} position={[0.15, 0.4, 0]}>
                <mesh position={[0, -0.3, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.6, 0.18]} />
                    <meshStandardMaterial color="gray" metalness={0.5} />
                </mesh>
            </group>

            {/* Jetpack */}
            <group ref={jetpack} position={[0, 0.8, -0.2]}>
                <mesh castShadow>
                    <boxGeometry args={[0.4, 0.5, 0.2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Thrusters */}
                <mesh position={[-0.1, -0.3, 0]}>
                    <cylinderGeometry args={[0.05, 0.1, 0.2]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[0.1, -0.3, 0]}>
                    <cylinderGeometry args={[0.05, 0.1, 0.2]} />
                    <meshStandardMaterial color="#555" />
                </mesh>

                {/* Flames */}
                {isJetpacking && (
                    <>
                        <mesh position={[-0.1, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[0.08, 0.4, 8]} />
                            <meshBasicMaterial color="orange" />
                        </mesh>
                        <mesh position={[0.1, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[0.08, 0.4, 8]} />
                            <meshBasicMaterial color="orange" />
                        </mesh>
                    </>
                )}
            </group>

            {/* Status Bars */}
            {(hpRatio < 1 || manaRatio < 1) && (
                <group position={[0, 1.8, 0]}>
                    {/* HP Bar */}
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[1, 0.1, 0.05]} />
                        <meshBasicMaterial color="gray" />
                    </mesh>
                    <mesh position={[-(1 - hpRatio) / 2, 0.1, 0.01]}>
                        <boxGeometry args={[hpRatio, 0.1, 0.05]} />
                        <meshBasicMaterial color="red" />
                    </mesh>

                    {/* Mana Bar */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1, 0.1, 0.05]} />
                        <meshBasicMaterial color="gray" />
                    </mesh>
                    <mesh position={[-(1 - manaRatio) / 2, 0, 0.01]}>
                        <boxGeometry args={[manaRatio, 0.1, 0.05]} />
                        <meshBasicMaterial color="blue" />
                    </mesh>
                </group>
            )}
        </group>
    );
};

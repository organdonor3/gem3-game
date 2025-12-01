import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DynamicShadow } from "../effects/DynamicShadow";

interface PlayerModelProps {
    color: string;
    isMoving?: boolean;
    isJumping?: boolean;
    isJetpacking?: boolean;
    isSlapping?: boolean;
    velocityRef?: React.MutableRefObject<THREE.Vector3>;
    cooldown?: number;
    manaRatio?: number;
    hpRatio?: number;
    leftHandColor?: string;
    rightHandColor?: string;
    activeEffects?: { type: string; duration: number; intensity?: number; startTime: number }[];
}

export const PlayerModel = ({
    color,
    isMoving,
    isJumping,
    isJetpacking,
    isSlapping,
    velocityRef,

    manaRatio = 1,
    hpRatio = 1,
    leftHandColor = "gray",
    rightHandColor = "gray",
    activeEffects = [],
}: PlayerModelProps) => {
    const group = useRef<THREE.Group>(null);
    const bodyGroup = useRef<THREE.Group>(null);
    const leftHand = useRef<THREE.Mesh>(null);
    const rightHand = useRef<THREE.Mesh>(null);
    const jetpack = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!group.current || !bodyGroup.current) return;

        const time = state.clock.elapsedTime;
        const velY = velocityRef?.current?.y || 0;

        const hoverY = Math.sin(time * 3) * 0.1 + 0.8; // Hover around y=0.8
        bodyGroup.current.position.y = THREE.MathUtils.lerp(bodyGroup.current.position.y, hoverY, 0.1);

        // --- TILT ANIMATION ---
        let targetTilt = 0;
        if (isMoving) targetTilt = 0.2; // Lean forward
        if (isJumping || isJetpacking) targetTilt = 0.4; // Lean more when flying

        bodyGroup.current.rotation.x = THREE.MathUtils.lerp(bodyGroup.current.rotation.x, targetTilt, 0.1);

        // --- HAND ANIMATION ---
        if (leftHand.current && rightHand.current) {
            // Hands float independently
            const handHover = Math.sin(time * 4) * 0.05;

            // Base positions relative to body (Lowered and closer)
            const leftBase = new THREE.Vector3(-0.35, 0.0, 0.25);
            const rightBase = new THREE.Vector3(0.35, 0.0, 0.25);

            let targetRotX = bodyGroup.current.rotation.x;
            // let targetRotZ = 0;

            if (isMoving) {
                // Hands trail behind and swing slightly
                leftBase.z -= 0.3;
                rightBase.z -= 0.3;
                leftBase.y += Math.sin(time * 10) * 0.1;
                rightBase.y += Math.sin(time * 10 + Math.PI) * 0.1;
            }

            // Velocity Response (Drag)
            // If moving up (velY > 0), hands drag down. If falling (velY < 0), hands drag up.
            const dragY = Math.max(-0.5, Math.min(0.5, -velY * 0.05));
            leftBase.y += dragY;
            rightBase.y += dragY;

            if (isJumping || isJetpacking) {
                // Stabilizer Pose (Down and Out)
                leftBase.x -= 0.1;
                rightBase.x += 0.1;
                leftBase.z -= 0.1;

                // Rotate palms down/back
                targetRotX += 0.5;
            }

            // Apply positions with smoothing
            leftHand.current.position.lerp(new THREE.Vector3(leftBase.x, leftBase.y + handHover, leftBase.z), 0.1);
            rightHand.current.position.lerp(new THREE.Vector3(rightBase.x, rightBase.y + handHover, rightBase.z), 0.1);

            // Hand Rotation
            leftHand.current.rotation.x = THREE.MathUtils.lerp(leftHand.current.rotation.x, targetRotX, 0.1);
            rightHand.current.rotation.x = THREE.MathUtils.lerp(rightHand.current.rotation.x, targetRotX, 0.1);

            // Add slight idle sway rotation
            leftHand.current.rotation.z = Math.sin(time * 2) * 0.1;
            rightHand.current.rotation.z = -Math.sin(time * 2) * 0.1;

            // --- SLAP ANIMATION ---
            if (isSlapping) {
                // Swing arms back and forth rapidly
                const slapSpeed = 15;
                const slapRange = 1.5;

                // Alternate arms
                leftHand.current.rotation.x += Math.sin(time * slapSpeed) * slapRange;
                rightHand.current.rotation.x += Math.cos(time * slapSpeed) * slapRange;

                // Move forward slightly
                leftHand.current.position.z += Math.sin(time * slapSpeed) * 0.2;
                rightHand.current.position.z += Math.cos(time * slapSpeed) * 0.2;
            }
        }

        // --- JETPACK EFFECTS ---
        if (jetpack.current) {
            // Jetpack follows body tilt
        }
    });

    return (
        <group ref={group} scale={1.5}>
            <group ref={bodyGroup}>
                {/* --- ROBOT BODY --- */}

                {/* Torso */}
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.4, 0.5, 0.3]} />
                    <meshStandardMaterial
                        color={(() => {
                            if (activeEffects.some(e => e.type === 'burning')) return "#ff4400";
                            if (activeEffects.some(e => e.type === 'frozen' || e.type === 'slow')) return "#00ffff";
                            if (activeEffects.some(e => e.type === 'wet')) return "#0000ff";
                            return color;
                        })()}
                        emissive={(() => {
                            if (activeEffects.some(e => e.type === 'burning')) return "#ff2200";
                            if (activeEffects.some(e => e.type === 'frozen')) return "#0088ff";
                            return "#000000";
                        })()}
                        emissiveIntensity={activeEffects.length > 0 ? 1 : 0}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Head */}
                <group position={[0, 0.45, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        <meshStandardMaterial
                            color={(() => {
                                if (activeEffects.some(e => e.type === 'burning')) return "#ff4400";
                                if (activeEffects.some(e => e.type === 'frozen' || e.type === 'slow')) return "#00ffff";
                                if (activeEffects.some(e => e.type === 'wet')) return "#0000ff";
                                return color;
                            })()}
                            emissive={(() => {
                                if (activeEffects.some(e => e.type === 'burning')) return "#ff2200";
                                if (activeEffects.some(e => e.type === 'frozen')) return "#0088ff";
                                return "#000000";
                            })()}
                            emissiveIntensity={activeEffects.length > 0 ? 1 : 0}
                            metalness={0.8}
                            roughness={0.2}
                        />
                    </mesh>
                    {/* Visor */}
                    <mesh position={[0, 0, 0.12]}>
                        <boxGeometry args={[0.2, 0.08, 0.1]} />
                        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
                    </mesh>
                    {/* Antenna */}
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
                        <meshStandardMaterial color="gray" />
                    </mesh>
                    {/* Antenna Light */}
                    <mesh position={[0, 0.3, 0]}>
                        <sphereGeometry args={[0.05, 16, 16]} />
                        <meshStandardMaterial
                            color={
                                hpRatio < 0.2
                                    ? "#ff0000" // Red when critical
                                    : new THREE.Color().lerpColors(
                                        new THREE.Color("#ffaa00"), // Orange at 20%
                                        new THREE.Color("#00ffff"), // Blue at 100%
                                        (hpRatio - 0.2) / 0.8 // Normalize 0.2-1.0 to 0-1
                                    )
                            }
                            emissive={
                                hpRatio < 0.2
                                    ? "#ff0000"
                                    : new THREE.Color().lerpColors(
                                        new THREE.Color("#ffaa00"),
                                        new THREE.Color("#00ffff"),
                                        (hpRatio - 0.2) / 0.8
                                    )
                            }
                            emissiveIntensity={
                                hpRatio < 0.2
                                    ? (Math.sin(Date.now() / 50) > 0 ? 5 : 0) // Fast Blink
                                    : 2 // Constant bright
                            }
                        />
                    </mesh>
                </group>

                {/* Floating Hands */}
                <mesh ref={leftHand} castShadow>
                    <boxGeometry args={[0.15, 0.15, 0.15]} />
                    <meshStandardMaterial
                        color={leftHandColor}
                        emissive={leftHandColor}
                        emissiveIntensity={0.5}
                        metalness={0.5}
                    />
                </mesh>
                <mesh ref={rightHand} castShadow>
                    <boxGeometry args={[0.15, 0.15, 0.15]} />
                    <meshStandardMaterial
                        color={rightHandColor}
                        emissive={rightHandColor}
                        emissiveIntensity={0.5}
                        metalness={0.5}
                    />
                </mesh>

                {/* Jetpack */}
                <group ref={jetpack} position={[0, 0.1, -0.2]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.3, 0.4, 0.15]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    {/* Thrusters */}
                    <mesh position={[-0.08, -0.25, 0]}>
                        <cylinderGeometry args={[0.04, 0.1, 0.1]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>
                    <mesh position={[0.08, -0.25, 0]}>
                        <cylinderGeometry args={[0.04, 0.1, 0.1]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>

                    {/* Flames */}
                    {isJetpacking && (
                        <>
                            <mesh position={[-0.08, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
                                <coneGeometry args={[0.06, 0.3, 8]} />
                                <meshBasicMaterial color="orange" />
                            </mesh>
                            <mesh position={[0.08, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
                                <coneGeometry args={[0.06, 0.3, 8]} />
                                <meshBasicMaterial color="orange" />
                            </mesh>
                        </>
                    )}

                    {/* Fuel Gauge (Tally Marks) */}
                    <group position={[0, 0.1, -0.08]}>
                        {Array.from({ length: 5 }).map((_, i) => {
                            const active = (i + 1) / 5 <= manaRatio + 0.1; // +0.1 for rounding forgiveness
                            return (
                                <mesh key={i} position={[(i - 2) * 0.05, 0, 0]}>
                                    <boxGeometry args={[0.03, 0.08, 0.01]} />
                                    <meshStandardMaterial
                                        color={active ? "#00ffff" : "#111111"}
                                        emissive={active ? "#00ffff" : "#000000"}
                                        emissiveIntensity={active ? 2 : 0}
                                    />
                                </mesh>
                            );
                        })}
                    </group>
                </group>
            </group>
            <DynamicShadow scale={1.2} opacity={0.6} />
        </group>
    );
};

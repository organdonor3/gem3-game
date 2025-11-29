import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from 'three';
import { EnemyHealthBar } from "./EnemyHealthBar";
import { DynamicShadow } from "../effects/DynamicShadow";
import { useEnemyStatus } from "./useEnemyStatus";
import { StatusIcons } from "../ui/StatusIcons";
import type { StatusEffect } from "./EnemyManager";
import { useTractorBeam } from "./hooks/useTractorBeam";

export const FlyingEnemy = ({ id, position, hp = 2, speedModifier = 1, statusEffects }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number, statusEffects?: StatusEffect[] }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 2;
    const meshRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const timeOffset = useRef(Math.random() * 100);

    // Use Centralized Status Logic
    const currentPosVec = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const { effectiveSpeed, movementOverride, isGrounded, canMove, colorOverlay } = useEnemyStatus(currentPosVec.current, statusEffects, 4 * speedModifier);

    // Tractor Beam Logic
    const isInBeam = useTractorBeam(id);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();
        currentPosVec.current.set(currentPos.x, currentPos.y, currentPos.z);

        // Tractor Beam Override
        if (isInBeam.current) {
            // For flying enemy, we need to override the hover logic
            // Just apply a strong upward velocity
            ref.current.setLinvel({ x: ref.current.linvel().x * 0.9, y: 5, z: ref.current.linvel().z * 0.9 }, true);
            return; // Skip other movement logic while in beam? Or just let it struggle?
            // If we return here, it won't move horizontally.
            // Let's just set Y and let horizontal logic run, but maybe dampened.
        }

        if (isGrounded) {
            ref.current.setGravityScale(1, true);
            ref.current.setLinvel({ x: ref.current.linvel().x * 0.95, y: ref.current.linvel().y, z: ref.current.linvel().z * 0.95 }, true);
            if (meshRef.current) {
                meshRef.current.rotation.z += 0.1;
                meshRef.current.rotation.x += 0.05;
            }
            return;
        } else {
            ref.current.setGravityScale(0, true);
        }

        if (!canMove) {
            ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            return;
        }

        let targetPos = new THREE.Vector3();
        let yVel = 0;

        if (movementOverride) {
            const moveDir = movementOverride;
            yVel = (5 - currentPos.y) * 2;
            ref.current.setLinvel({ x: moveDir.x * effectiveSpeed, y: isInBeam.current ? 5 : yVel, z: moveDir.z * effectiveSpeed }, true);

            // Banking
            if (meshRef.current) {
                meshRef.current.rotation.z = -moveDir.x * 0.5;
                meshRef.current.rotation.x = moveDir.z * 0.2;
            }
        } else {
            // Normal Circle Logic
            const radius = 15;
            const targetX = Math.sin(time * 0.5) * radius;
            const targetZ = Math.cos(time * 0.5) * radius;
            targetPos.set(targetX, 5, targetZ);

            const dir = targetPos.clone().sub(currentPos).normalize();
            const hoverY = Math.sin(time * 2) * 2;
            yVel = (targetPos.y + hoverY - currentPos.y) * 2;

            ref.current.setLinvel({ x: dir.x * effectiveSpeed, y: isInBeam.current ? 5 : yVel, z: dir.z * effectiveSpeed }, true);

            // Banking Visuals
            if (meshRef.current) {
                meshRef.current.rotation.z = -dir.x * 0.5;
                meshRef.current.rotation.x = dir.z * 0.2;
                if (ringRef.current) ringRef.current.rotation.y += 0.2;
            }
        }
    });

    if (hp <= 0) return null;

    return (
        <RigidBody
            ref={ref}
            position={position}
            gravityScale={0}
            colliders="ball"
            lockRotations
            userData={useMemo(() => ({ tag: 'enemy', id: id }), [id])}
            name={id}
        >
            <StatusIcons effects={statusEffects} />
            <group ref={meshRef} name={id}>
                {/* Central Dome */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color={colorOverlay || "#9370DB"} metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Rotating Ring */}
                <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.8, 0.1, 8, 32]} />
                    <meshStandardMaterial color={colorOverlay || "#4B0082"} emissive={colorOverlay || "#4B0082"} emissiveIntensity={0.5} />
                </mesh>

                {/* Engine Glow */}
                <mesh position={[0, -0.4, 0]}>
                    <cylinderGeometry args={[0.2, 0.05, 0.5]} />
                    <meshBasicMaterial color="cyan" />
                </mesh>

                {/* Alien Eyes */}
                <mesh position={[0.2, 0.2, 0.4]}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="red" />
                </mesh>
                <mesh position={[-0.2, 0.2, 0.4]}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="red" />
                </mesh>
            </group>
            <EnemyHealthBar hp={hp} maxHp={maxHp} />
            <DynamicShadow scale={1.2} opacity={0.4} />
        </RigidBody>
    );
};

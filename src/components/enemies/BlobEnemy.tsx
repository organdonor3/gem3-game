import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { EnemyHealthBar } from "./EnemyHealthBar";
import { DynamicShadow } from "../effects/DynamicShadow";
import { useEnemyStatus } from "./useEnemyStatus";
import { StatusIcons } from "../ui/StatusIcons";
import type { StatusEffect } from "./EnemyManager";
import { useTractorBeam } from "./hooks/useTractorBeam";

export const BlobEnemy = ({ id, position, hp = 3, speedModifier = 1, statusEffects }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number, statusEffects?: StatusEffect[] }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 3;
    const meshRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Mesh>(null);
    const timeOffset = useRef(Math.random() * 100);

    // Use Centralized Status Logic
    const currentPosVec = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const { effectiveSpeed, movementOverride, canMove, colorOverlay } = useEnemyStatus(currentPosVec.current, statusEffects, 2 * speedModifier);

    // Tractor Beam Logic
    const isInBeam = useTractorBeam(id);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();
        currentPosVec.current.set(currentPos.x, currentPos.y, currentPos.z);

        // Tractor Beam Override
        if (isInBeam.current) {
            ref.current.applyImpulse({ x: 0, y: 0.2, z: 0 }, true);
            // Dampen horizontal movement slightly while in beam?
            // For now just let them float up
        }

        if (!canMove) {
            ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);
            return;
        }

        let moveDir = new THREE.Vector3();

        if (movementOverride) {
            moveDir.copy(movementOverride);
        } else {
            // Wander Logic
            const wanderX = Math.sin(time * 0.5) * 10;
            const wanderZ = Math.cos(time * 0.3) * 10;
            const targetPos = new THREE.Vector3(wanderX, 0, wanderZ);
            moveDir.subVectors(targetPos, new THREE.Vector3(currentPos.x, 0, currentPos.z)).normalize();
        }

        ref.current.setLinvel({ x: moveDir.x * effectiveSpeed, y: ref.current.linvel().y, z: moveDir.z * effectiveSpeed }, true);

        // Alien Wobble Animation
        if (meshRef.current) {
            const pulsate = Math.sin(time * 5) * 0.1;
            meshRef.current.scale.set(1 + pulsate, 1 - pulsate, 1 + pulsate);

            if (innerRef.current) {
                innerRef.current.rotation.x = time;
                innerRef.current.rotation.y = time * 1.5;
            }
        }
    });

    if (hp <= 0) return null;

    return (
        <RigidBody
            ref={ref}
            position={position}
            colliders="ball"
            friction={0}
            restitution={0}
            lockRotations
            userData={useMemo(() => ({ tag: 'enemy', id: id }), [id])}
            name={id}
        >
            <StatusIcons effects={statusEffects} />
            <group ref={meshRef} name={id}>
                {/* Outer Shell */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshStandardMaterial color={colorOverlay || "#7FFF00"} transparent opacity={0.6} roughness={0.1} />
                </mesh>

                {/* Inner Core (Nucleus) */}
                <mesh ref={innerRef} position={[0, 0, 0]}>
                    <dodecahedronGeometry args={[0.4]} />
                    <meshStandardMaterial color={colorOverlay || "#006400"} emissive={colorOverlay || "#00FF00"} emissiveIntensity={0.5} wireframe />
                </mesh>

                {/* Floating "Eyes" */}
                <mesh position={[0.4, 0.3, 0.4]}>
                    <sphereGeometry args={[0.15]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.4, 0.3, 0.4]}>
                    <sphereGeometry args={[0.15]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </group>
            <EnemyHealthBar hp={hp} maxHp={maxHp} />
            <DynamicShadow scale={1.5} opacity={0.6} />
        </RigidBody>
    );
};

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { EnemyHealthBar } from "./EnemyHealthBar";
import { DynamicShadow } from "../effects/DynamicShadow";
import { useEnemyStatus } from "./useEnemyStatus";
import { StatusIcons } from "../ui/StatusIcons";
import type { StatusEffect } from "./EnemyManager";
import { useTractorBeam } from "./hooks/useTractorBeam";

export const TankEnemy = ({ id, position, hp = 10, speedModifier = 1, statusEffects }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number, statusEffects?: StatusEffect[] }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 10;
    const groupRef = useRef<THREE.Group>(null);
    const timeOffset = useRef(Math.random() * 100);

    // Use Centralized Status Logic
    const currentPosVec = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const { effectiveSpeed, movementOverride, canMove, colorOverlay } = useEnemyStatus(currentPosVec.current, statusEffects, 1.5 * speedModifier);

    // Tractor Beam Logic
    const isInBeam = useTractorBeam(id);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();
        currentPosVec.current.set(currentPos.x, currentPos.y, currentPos.z);

        // Tractor Beam Override
        if (isInBeam.current) {
            ref.current.applyImpulse({ x: 0, y: 0.5, z: 0 }, true); // Heavier, needs more force? Or same force = slower lift
        }

        if (!canMove) {
            ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);
            return;
        }

        let moveDir = new THREE.Vector3();

        if (movementOverride) {
            moveDir.copy(movementOverride);
        } else {
            // Patrol Logic
            const patrolX = Math.sin(time * 0.2) * 20;
            const targetPos = new THREE.Vector3(patrolX, 0, 0);
            moveDir.subVectors(targetPos, new THREE.Vector3(currentPos.x, 0, currentPos.z)).normalize();
        }

        ref.current.setLinvel({ x: moveDir.x * effectiveSpeed, y: ref.current.linvel().y, z: moveDir.z * effectiveSpeed }, true);

        // Heavy Breathing / Stomping Animation
        if (groupRef.current) {
            groupRef.current.position.y = Math.abs(Math.sin(time * 2)) * 0.2;
            groupRef.current.rotation.z = Math.sin(time * 2) * 0.05; // Waddle
        }
    });

    if (hp <= 0) return null;

    return (
        <RigidBody
            ref={ref}
            position={position}
            colliders="cuboid"
            friction={0}
            restitution={0}
            lockRotations
            userData={useMemo(() => ({ tag: 'enemy', id: id }), [id])}
            name={id}
        >
            <StatusIcons effects={statusEffects} />
            <group ref={groupRef} name={id}>
                {/* Main Carapace */}
                <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.5, 1, 1.5]} />
                    <meshStandardMaterial color={colorOverlay || "#8B0000"} roughness={0.8} />
                </mesh>

                {/* Upper Shell */}
                <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.5, 1, 0.5, 6]} />
                    <meshStandardMaterial color={colorOverlay || "#550000"} roughness={0.5} />
                </mesh>

                {/* Spikes */}
                <mesh position={[0.6, 1, 0.6]} rotation={[0, 0, -Math.PI / 4]}>
                    <coneGeometry args={[0.2, 0.8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.6, 1, 0.6]} rotation={[0, 0, Math.PI / 4]}>
                    <coneGeometry args={[0.2, 0.8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0.6, 1, -0.6]} rotation={[0, 0, -Math.PI / 4]}>
                    <coneGeometry args={[0.2, 0.8]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.6, 1, -0.6]} rotation={[0, 0, Math.PI / 4]}>
                    <coneGeometry args={[0.2, 0.8]} />
                    <meshStandardMaterial color="black" />
                </mesh>

                {/* Glowing Eyes */}
                <mesh position={[0, 0.8, 0.8]}>
                    <boxGeometry args={[0.8, 0.2, 0.1]} />
                    <meshBasicMaterial color="yellow" />
                </mesh>
            </group>
            <EnemyHealthBar hp={hp} maxHp={maxHp} />
            <DynamicShadow scale={2} opacity={0.8} />
        </RigidBody>
    );
};

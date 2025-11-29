import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from 'three';
import { EnemyHealthBar } from "./EnemyHealthBar";

export const FlyingEnemy = ({ id, position, hp = 2, speedModifier = 1 }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 2;
    const meshRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    // Movement State
    const timeOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();

        // Circle Logic: Orbit around the center
        const radius = 15;
        const targetX = Math.sin(time * 0.5) * radius;
        const targetZ = Math.cos(time * 0.5) * radius;
        const targetPos = new THREE.Vector3(targetX, 5, targetZ); // Hover at height 5

        const dir = targetPos.sub(currentPos).normalize();
        const speed = 4 * speedModifier;

        // Bob up and down
        const hoverY = Math.sin(time * 2) * 2;

        ref.current.setLinvel({ x: dir.x * speed, y: (targetPos.y + hoverY - currentPos.y) * 2, z: dir.z * speed }, true);

        // Banking Visuals
        if (meshRef.current) {
            meshRef.current.rotation.z = -dir.x * 0.5; // Bank into turn
            meshRef.current.rotation.x = dir.z * 0.2; // Pitch forward

            // Spin the ring
            if (ringRef.current) {
                ringRef.current.rotation.y += 0.2;
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
            <group ref={meshRef} name={id}>
                {/* Central Dome */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color="#9370DB" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Rotating Ring */}
                <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.8, 0.1, 8, 32]} />
                    <meshStandardMaterial color="#4B0082" emissive="#4B0082" emissiveIntensity={0.5} />
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
        </RigidBody>
    );
};

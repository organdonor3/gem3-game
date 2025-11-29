import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { EnemyHealthBar } from "./EnemyHealthBar";

export const SpeedyEnemy = ({ id, position, hp = 1, speedModifier = 1 }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 1;
    const groupRef = useRef<THREE.Group>(null);
    const legsRef = useRef<THREE.Group>(null);

    // Movement State
    const timeOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();

        // Figure-8 Logic
        const scale = 15;
        const targetX = Math.sin(time) * scale;
        const targetZ = Math.sin(time * 2) * (scale / 2);
        const targetPos = new THREE.Vector3(targetX, 0, targetZ);

        const direction = new THREE.Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z).normalize();
        const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();

        // Add some jitter
        const offset = Math.sin(time * 10) * 2;
        const moveDir = direction.add(right.multiplyScalar(offset * 0.2)).normalize();
        const speed = 7 * speedModifier; // Fast

        ref.current.setLinvel({ x: moveDir.x * speed, y: ref.current.linvel().y, z: moveDir.z * speed }, true);

        // Face movement
        const angle = Math.atan2(moveDir.x, moveDir.z);
        ref.current.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), true);

        // Animation
        if (groupRef.current) {
            // Lean into turns
            groupRef.current.rotation.z = -offset * 0.1;
        }
        if (legsRef.current) {
            // Scuttle legs
            legsRef.current.rotation.x = Math.sin(time * 30) * 0.5;
        }
    });



    if (hp <= 0) return null;

    return (
        <RigidBody
            ref={ref}
            position={position}
            colliders="hull"
            friction={0}
            restitution={0}
            lockRotations
            userData={useMemo(() => ({ tag: 'enemy', id: id }), [id])}
            name={id}
        >
            <group ref={groupRef} name={id}>
                {/* Body */}
                <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.3, 1.2, 5]} />
                    <meshStandardMaterial color="#FFD700" roughness={0.4} metalness={0.6} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 0.2, 0.6]}>
                    <boxGeometry args={[0.4, 0.3, 0.5]} />
                    <meshStandardMaterial color="#DAA520" />
                </mesh>

                {/* Eyes */}
                <mesh position={[0.15, 0.25, 0.8]}>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="red" />
                </mesh>
                <mesh position={[-0.15, 0.25, 0.8]}>
                    <sphereGeometry args={[0.05]} />
                    <meshBasicMaterial color="red" />
                </mesh>

                {/* Legs (Visual Group) */}
                <group ref={legsRef} position={[0, -0.2, 0]}>
                    <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.1, 0.6, 0.1]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.1, 0.6, 0.1]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                </group>
            </group>
            <EnemyHealthBar hp={hp} maxHp={maxHp} />
        </RigidBody>
    );
};

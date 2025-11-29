import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { EnemyHealthBar } from "./EnemyHealthBar";

export const TankEnemy = ({ id, position, hp = 10, speedModifier = 1 }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 10;
    const groupRef = useRef<THREE.Group>(null);

    // Movement State
    const timeOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();

        // Patrol Logic: Move back and forth along an axis
        // Or move slowly towards center but stop occasionally
        const patrolX = Math.sin(time * 0.2) * 20;
        const targetPos = new THREE.Vector3(patrolX, 0, 0);

        const direction = new THREE.Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z).normalize();
        const speed = 1.5 * speedModifier; // Slow

        ref.current.setLinvel({ x: direction.x * speed, y: ref.current.linvel().y, z: direction.z * speed }, true);

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
            <group ref={groupRef} name={id}>
                {/* Main Carapace */}
                <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.5, 1, 1.5]} />
                    <meshStandardMaterial color="#8B0000" roughness={0.8} />
                </mesh>

                {/* Upper Shell */}
                <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.5, 1, 0.5, 6]} />
                    <meshStandardMaterial color="#550000" roughness={0.5} />
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
        </RigidBody>
    );
};

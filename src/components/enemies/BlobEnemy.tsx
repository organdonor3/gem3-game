import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { EnemyHealthBar } from "./EnemyHealthBar";

export const BlobEnemy = ({ id, position, hp = 3, speedModifier = 1 }: { id: string, position: [number, number, number], hp?: number, speedModifier?: number }) => {
    const ref = useRef<RapierRigidBody>(null);
    const maxHp = 3;
    const meshRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    // Movement State
    const timeOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        if (!ref.current || hp <= 0) return;

        const time = state.clock.getElapsedTime() + timeOffset.current;
        const currentPos = ref.current.translation();

        // Wander Logic: Move in a Perlin-like noise pattern (using sines)
        // Instead of chasing center, they wander aimlessly but stay somewhat near center
        const wanderX = Math.sin(time * 0.5) * 10;
        const wanderZ = Math.cos(time * 0.3) * 10;
        const targetPos = new THREE.Vector3(wanderX, 0, wanderZ);

        const direction = new THREE.Vector3(targetPos.x - currentPos.x, 0, targetPos.z - currentPos.z).normalize();
        const speed = 2 * speedModifier;

        ref.current.setLinvel({ x: direction.x * speed, y: ref.current.linvel().y, z: direction.z * speed }, true);

        // Alien Wobble Animation
        if (meshRef.current) {
            // Outer shell pulsates
            const pulsate = Math.sin(time * 5) * 0.1;
            meshRef.current.scale.set(1 + pulsate, 1 - pulsate, 1 + pulsate);

            // Inner core rotates
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
            name={id} // Ensure RigidBody has name for raycasting/lookups if needed
        >
            <group ref={meshRef} name={id}> {/* Ensure inner group has name for scene graph lookup */}
                {/* Outer Shell */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshStandardMaterial color="#7FFF00" transparent opacity={0.6} roughness={0.1} />
                </mesh>

                {/* Inner Core (Nucleus) */}
                <mesh ref={innerRef} position={[0, 0, 0]}>
                    <dodecahedronGeometry args={[0.4]} />
                    <meshStandardMaterial color="#006400" emissive="#00FF00" emissiveIntensity={0.5} wireframe />
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
        </RigidBody>
    );
};

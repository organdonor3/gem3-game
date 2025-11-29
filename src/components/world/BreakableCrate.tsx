import { useRef, useState } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";

interface BreakableCrateProps {
    position: [number, number, number];
}

export const BreakableCrate = ({ position }: BreakableCrateProps) => {
    const [isBroken, setIsBroken] = useState(false);
    const ref = useRef<RapierRigidBody>(null);

    const handleCollision = () => {
        if (isBroken) return;

        // Check impact velocity (approximate)
        const velocity = ref.current?.linvel();
        if (velocity) {
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
            if (speed > 10) { // Break threshold
                setIsBroken(true);
            }
        }
    };

    if (isBroken) {
        // Spawn debris (simplified: 4 smaller cubes)
        return (
            <group position={position}>
                {[[-0.2, 0.2, -0.2], [0.2, 0.2, 0.2], [-0.2, -0.2, 0.2], [0.2, -0.2, -0.2]].map((offset, i) => (
                    <RigidBody key={i} position={offset as [number, number, number]} colliders="cuboid">
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[0.4, 0.4, 0.4]} />
                            <meshStandardMaterial color="#8B4513" />
                        </mesh>
                    </RigidBody>
                ))}
            </group>
        );
    }

    return (
        <RigidBody
            ref={ref}
            position={position}
            colliders="cuboid"
            onCollisionEnter={handleCollision}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
        </RigidBody>
    );
};

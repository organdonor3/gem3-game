import { RigidBody } from "@react-three/rapier";

export const SpawnPillar = ({ position, color = "#4B0082" }: { position: [number, number, number], color?: string }) => {
    return (
        <group position={position}>
            <RigidBody type="fixed" colliders="hull">
                {/* Base */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[2, 2.5, 5, 8]} />
                    <meshStandardMaterial color="#2F4F4F" roughness={0.8} />
                </mesh>

                {/* Top Platform */}
                <mesh position={[0, 5.1, 0]} receiveShadow>
                    <cylinderGeometry args={[2.2, 2.2, 0.2, 8]} />
                    <meshStandardMaterial color="#696969" roughness={0.6} />
                </mesh>

                {/* Glowing Rune */}
                <mesh position={[0, 5.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1, 1.5, 6]} />
                    <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>

                {/* Light */}
                <pointLight position={[0, 6, 0]} color={color} intensity={2} distance={10} />
            </RigidBody>
        </group>
    );
};

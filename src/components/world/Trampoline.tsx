import { RigidBody, CuboidCollider } from "@react-three/rapier";

interface TrampolineProps {
    position: [number, number, number];
}

export const Trampoline = ({ position }: TrampolineProps) => {
    return (
        <group position={position}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]} receiveShadow>
                <cylinderGeometry args={[1.5, 1.5, 0.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Bouncy Surface */}
            <RigidBody type="fixed" restitution={2.5}>
                <CuboidCollider args={[1, 0.1, 1]} position={[0, 0.2, 0]} />
                <mesh position={[0, 0.2, 0]} receiveShadow>
                    <cylinderGeometry args={[1.2, 1.2, 0.1]} />
                    <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} />
                </mesh>
            </RigidBody>
        </group>
    );
};

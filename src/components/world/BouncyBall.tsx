import { RigidBody } from "@react-three/rapier";

interface BouncyBallProps {
    position: [number, number, number];
    color?: string;
}

export const BouncyBall = ({ position, color = "hotpink" }: BouncyBallProps) => {
    return (
        <RigidBody position={position} colliders="ball" restitution={1.2} friction={0.5}>
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </RigidBody>
    );
};

import { RigidBody } from "@react-three/rapier";

interface MovableBoxProps {
    position: [number, number, number];
    color?: string;
}

export const MovableBox = ({ position, color = "orange" }: MovableBoxProps) => {
    return (
        <RigidBody position={position} colliders="cuboid" restitution={0.2} friction={1}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </RigidBody>
    );
};

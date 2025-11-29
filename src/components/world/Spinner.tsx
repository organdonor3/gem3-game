import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";

interface SpinnerProps {
    position: [number, number, number];
    speed?: number;
}

export const Spinner = ({ position, speed = 2 }: SpinnerProps) => {
    const ref = useRef<RapierRigidBody>(null);

    useFrame(() => {
        if (ref.current) {
            ref.current.setAngvel({ x: 0, y: speed, z: 0 }, true);
        }
    });

    return (
        <RigidBody ref={ref} position={position} type="kinematicPosition">
            <mesh castShadow receiveShadow>
                <boxGeometry args={[4, 0.5, 0.5]} />
                <meshStandardMaterial color="red" />
            </mesh>
            <mesh castShadow receiveShadow rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[4, 0.5, 0.5]} />
                <meshStandardMaterial color="red" />
            </mesh>
        </RigidBody>
    );
};

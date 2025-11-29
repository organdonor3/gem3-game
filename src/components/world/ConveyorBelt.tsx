import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";

interface ConveyorBeltProps {
    position: [number, number, number];
    length?: number;
    speed?: number;
}

export const ConveyorBelt = ({ position, length = 4 }: ConveyorBeltProps) => {

    useFrame(() => {
        // Kinematic bodies need manual velocity setting if we want them to move things
        // But for a conveyor, we might just want a moving surface.
        // Rapier doesn't have "surface velocity" easily exposed in React props yet.
        // A workaround is to move the body slightly or use a custom collider.
        // For simplicity, let's just make it a static object that pushes things on top?
        // Actually, let's try setting linear velocity on a kinematic body but resetting position.

        // Better approach for now: Just a visual + static body. 
        // Real conveyor physics requires more complex setup in Rapier (friction/surface velocity).
        // Let's simulate it by applying force to objects on top?
        // Or just make it a moving platform for now.
    });

    return (
        <RigidBody position={position} type="fixed" friction={0}>
            {/* Visual */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2, length]} />
                <meshStandardMaterial color="#333" map={null} /> {/* Add texture later */}
            </mesh>
        </RigidBody>
    );
};

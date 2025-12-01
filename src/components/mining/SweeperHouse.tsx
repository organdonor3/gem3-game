import { SweeperBot } from './SweeperBot';
import { RigidBody } from '@react-three/rapier';

interface SweeperHouseProps {
    position: [number, number, number];
    level: number;
    ownerId: string;
    fragments: { id: string; position: [number, number, number]; value: number }[];
}

export const SweeperHouse = ({ position, ownerId, fragments }: SweeperHouseProps) => {
    return (
        <>
            <RigidBody type="fixed" position={position} colliders="cuboid">
                <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
                    <boxGeometry args={[2, 1.5, 2]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                {/* Door */}
                <mesh position={[0, 0.5, 1.01]}>
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </RigidBody>

            {/* Spawn a bot nearby */}
            <SweeperBot
                position={[position[0], position[1] + 1, position[2] + 2]}
                ownerId={ownerId}
                fragments={fragments}
            />
        </>
    );
};

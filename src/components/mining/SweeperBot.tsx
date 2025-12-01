import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

interface SweeperBotProps {
    position: [number, number, number];
    ownerId: string;
    fragments: { id: string; position: [number, number, number]; value: number }[];
}

export const SweeperBot = ({ position, ownerId, fragments }: SweeperBotProps) => {
    const rigidBody = useRef<RapierRigidBody>(null);

    useFrame(() => {
        if (!rigidBody.current) return;

        // Find nearest fragment
        let nearest = null;
        let minDist = Infinity;
        const currentPos = rigidBody.current.translation();
        const currentVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

        for (const f of fragments) {
            const fPos = new THREE.Vector3(f.position[0], f.position[1], f.position[2]);
            const dist = currentVec.distanceTo(fPos);
            if (dist < minDist) {
                minDist = dist;
                nearest = fPos;
            }
        }

        if (nearest) {
            // Move towards nearest
            const direction = nearest.clone().sub(currentVec).normalize();
            const speed = 8;

            // Apply velocity
            rigidBody.current.setLinvel({
                x: direction.x * speed,
                y: rigidBody.current.linvel().y,
                z: direction.z * speed
            }, true);

            // Rotate towards target
            const angle = Math.atan2(direction.x, direction.z);
            const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            rigidBody.current.setRotation(rotation, true);
        } else {
            // Idle / Stop
            rigidBody.current.setLinvel({
                x: 0,
                y: rigidBody.current.linvel().y,
                z: 0
            }, true);
        }
    });

    return (
        <RigidBody
            ref={rigidBody}
            position={position}
            colliders="ball"
            friction={0}
            userData={{ tag: 'sweeper', ownerId }}
            lockRotations
        >
            <mesh castShadow>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="#00ff00" />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.2, 0.2, 0.3]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.2, 0.2, 0.3]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </RigidBody>
    );
};

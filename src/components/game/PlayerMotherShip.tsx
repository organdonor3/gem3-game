import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, BallCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../../stores/useGameStore";
import { myPlayer } from "playroomkit";

interface PlayerMotherShipProps {
    playerId: string;
    position: [number, number, number];
    color: string;
    velocity: [number, number, number]; // Controlled by parent
}

export const PlayerMotherShip = ({ playerId, position, color, velocity }: PlayerMotherShipProps) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const { addPlayerScore } = useGameStore();
    const isMe = playerId === myPlayer()?.id;

    // Local position state to drive kinematic movement
    // We initialize it with the prop position to ensure it starts correctly
    const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

    // Sync ref if prop changes (e.g. respawn)
    useEffect(() => {
        currentPos.current.set(position[0], position[1], position[2]);
        if (rigidBody.current) {
            rigidBody.current.setTranslation(currentPos.current, true);
        }
    }, [position[0], position[1], position[2]]);

    useFrame((_, delta) => {
        if (rigidBody.current) {
            // Validate velocity
            const vx = Number.isFinite(velocity[0]) ? velocity[0] : 0;
            const vz = Number.isFinite(velocity[2]) ? velocity[2] : 0;

            // Update local position based on velocity
            currentPos.current.x += vx * delta;
            currentPos.current.z += vz * delta;

            // Force Y height
            currentPos.current.y = 3;

            // Apply to physics body
            rigidBody.current.setNextKinematicTranslation(currentPos.current);
        }
    });

    const handleCollision = (e: any) => {
        // Only the owner handles scoring to avoid duplicates
        if (!isMe) return;

        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'enemy') {
            // Destroy Enemy (Need a way to signal this globally? Or just rely on local simulation if enemies are synced?)
            // For now, let's assume enemies are synced entities. 
            // If we destroy it here, we need to tell the EnemyManager.
            // A simple way is to dispatch an event.
            window.dispatchEvent(new CustomEvent('enemy-collected', { detail: { enemyId: other.userData.id, playerId } }));
            addPlayerScore(playerId, 1);
        }
    };

    return (
        <RigidBody
            ref={rigidBody}
            position={position}
            type="kinematicPosition"
            gravityScale={0}
            linearDamping={2}
            angularDamping={2}
            colliders={false}
            userData={{ tag: 'mothership', id: playerId }}
        >
            {/* Ship Body */}
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <coneGeometry args={[0.5, 1, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>

            {/* Tractor Beam Area (Sensor) */}
            <BallCollider args={[3]} sensor onIntersectionEnter={handleCollision} />

            {/* Physical Collider */}
            <BallCollider args={[1]} />

            {/* Tractor Beam Visual */}
            <mesh position={[0, -2, 0]}>
                <cylinderGeometry args={[0.2, 3, 4, 32, 1, true]} />
                <meshStandardMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>
        </RigidBody>
    );
};

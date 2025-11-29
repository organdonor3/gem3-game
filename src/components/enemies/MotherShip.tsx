import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CuboidCollider, CylinderCollider, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { isHost, myPlayer, usePlayersList } from "playroomkit";
import { useGameStore } from "../../stores/useGameStore";
import { GameConfig } from "../../config";

export const MotherShip = () => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const { isMotherShipActive } = useGameStore();
    const players = usePlayersList(true);
    const [targetPos, setTargetPos] = useState(new THREE.Vector3(0, 10, 0));
    const timeRef = useRef(0);
    const spawnTimer = useRef(0);

    // Visuals
    const shipColor = "#444444";
    const glowColor = "#00ffcc";

    useFrame((state, delta) => {
        if (!isMotherShipActive || !rigidBody.current) return;

        timeRef.current += delta;

        // --- HOST LOGIC: Movement & Spawning ---
        if (isHost()) {
            // 1. Find Nearest Player
            let nearestDist = Infinity;
            let nearestPlayerPos = new THREE.Vector3(0, 0, 0);
            let foundPlayer = false;

            players.forEach(p => {
                const pos = p.getState("pos");
                if (pos) {
                    const pPos = new THREE.Vector3(pos.x, pos.y, pos.z);
                    const dist = pPos.distanceTo(targetPos); // Compare to current target/ship pos
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestPlayerPos = pPos;
                        foundPlayer = true;
                    }
                }
            });

            // 2. Move towards player (hovering)
            if (foundPlayer) {
                const hoverHeight = 8 + Math.sin(timeRef.current * 0.5) * 2; // Bobbing
                const desiredPos = new THREE.Vector3(nearestPlayerPos.x, hoverHeight, nearestPlayerPos.z);

                // Smooth Lerp
                const currentPos = rigidBody.current.translation();
                const newPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(desiredPos, delta * 0.5);

                rigidBody.current.setNextKinematicTranslation(newPos);
            } else {
                // Idle circle
                const idleX = Math.sin(timeRef.current * 0.2) * 20;
                const idleZ = Math.cos(timeRef.current * 0.2) * 20;
                const newPos = new THREE.Vector3(idleX, 10, idleZ);
                rigidBody.current.setNextKinematicTranslation(newPos);
            }

            // 3. Spawning
            spawnTimer.current += delta;
            if (spawnTimer.current > 10) { // Every 10 seconds
                spawnTimer.current = 0;
                // Trigger spawn event (handled by EnemyManager or GameScene)
                // For now, we can just log or dispatch a custom event
                const currentPos = rigidBody.current.translation();
                const dropPos = new THREE.Vector3(currentPos.x, currentPos.y - 2, currentPos.z);

                // Random offset for bay doors
                const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
                dropPos.add(offset);

                window.dispatchEvent(new CustomEvent('spawn-enemy', {
                    detail: {
                        position: dropPos,
                        type: 'random'
                    }
                }));
            }
        }
    });

    if (!isMotherShipActive) return null;

    return (
        <RigidBody
            ref={rigidBody}
            type="kinematicPosition"
            position={[0, 10, 0]}
            colliders={false} // Custom colliders
            name="MotherShip"
        >
            {/* Main Body - Platform */}
            <CuboidCollider args={[6, 1, 6]} />
            <mesh castShadow receiveShadow>
                <boxGeometry args={[12, 2, 12]} />
                <meshStandardMaterial color={shipColor} />
            </mesh>

            {/* Bay Doors (Visual) */}
            {[[-3, -1.1, -3], [3, -1.1, -3], [-3, -1.1, 3], [3, -1.1, 3]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <boxGeometry args={[2, 0.2, 2]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            ))}

            {/* Tractor Beam (Visual + Sensor) */}
            <group position={[0, -6, 0]}>
                {/* Visual Beam */}
                <mesh>
                    <cylinderGeometry args={[2, 4, 10, 16, 1, true]} />
                    <meshBasicMaterial color={glowColor} transparent opacity={0.2} side={THREE.DoubleSide} />
                </mesh>

                {/* Sensor for Physics Interaction */}
                <CylinderCollider
                    args={[5, 2]} // Half-height, radius
                    sensor
                    onIntersectionEnter={(payload) => {
                        if (payload.other.rigidBodyObject?.userData?.tag === 'player') {
                            // Apply force logic here or set flag on player
                            // Since we can't easily apply force to another RB from here without reference,
                            // we'll dispatch an event that PlayerController listens to, or rely on Player checking for this sensor?
                            // Easier: Dispatch event 'enter-tractor-beam'
                            window.dispatchEvent(new CustomEvent('tractor-beam', {
                                detail: {
                                    active: true,
                                    playerId: payload.other.rigidBodyObject.userData.id
                                }
                            }));
                        }
                    }}
                    onIntersectionExit={(payload) => {
                        if (payload.other.rigidBodyObject?.userData?.tag === 'player') {
                            window.dispatchEvent(new CustomEvent('tractor-beam', {
                                detail: {
                                    active: false,
                                    playerId: payload.other.rigidBodyObject.userData.id
                                }
                            }));
                        }
                    }}
                />
            </group>
        </RigidBody>
    );
};

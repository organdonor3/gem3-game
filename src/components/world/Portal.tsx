import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useMultiplayerState } from "playroomkit";
import type { PlayerState } from "playroomkit";
import robotoFont from '../../assets/fonts/roboto.woff';

interface PortalProps {
    position: [number, number, number];
    targetMode: string;
    onTeleport: () => void;
    players: PlayerState[];
}

export const Portal = ({ position, targetMode, onTeleport, players }: PortalProps) => {
    const [playersOnPortal, setPlayersOnPortal] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Visual Refs
    const ringRef = useRef<THREE.Mesh>(null);

    // Sync countdown across network? 
    // For simplicity, let's keep it local logic driven by state, but ideally we sync the start time.
    // Actually, let's use a simple local countdown for now, triggered when *any* player is on.
    // If we want it robust, one player should "host" the countdown or use a synced state.
    // Let's try to use a synced "portalStartTime" state.

    const [portalStartTime, setPortalStartTime] = useMultiplayerState(`portal_${targetMode}_start`, -1);

    useEffect(() => {
        if (playersOnPortal.length > 0 && portalStartTime === -1) {
            // First player entered, start timer
            setPortalStartTime(Date.now());
        } else if (playersOnPortal.length === 0 && portalStartTime !== -1) {
            // Everyone left, cancel timer
            setPortalStartTime(-1);
        }
    }, [playersOnPortal, portalStartTime, setPortalStartTime]);

    useFrame(() => {
        // Rotate ring
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.02;
        }

        // Check Countdown
        if (portalStartTime !== -1) {
            const elapsed = (Date.now() - portalStartTime) / 1000;
            const remaining = Math.max(0, 10 - elapsed);
            setCountdown(remaining);

            // Instant Teleport if ALL players are here
            const allPlayersPresent = players.length > 0 && playersOnPortal.length === players.length;

            if (remaining <= 0 || allPlayersPresent) {
                // Trigger!
                // Only one person needs to trigger the mode switch really, but let's have the host do it or just whoever.
                // To avoid race conditions, maybe just check if *I* am the one to trigger it?
                // Or just call onTeleport() which should handle the state change idempotently.
                if (remaining <= 0 || allPlayersPresent) {
                    // Reset timer
                    setPortalStartTime(-1);
                    onTeleport();
                }
            }
        } else {
            setCountdown(null);
        }
    });

    const handleIntersectionEnter = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player') {
            const playerId = other.userData.id;
            setPlayersOnPortal(prev => [...new Set([...prev, playerId])]);
        }
    };

    const handleIntersectionExit = (e: any) => {
        const other = e.other.rigidBodyObject;
        if (other && other.userData?.tag === 'player') {
            const playerId = other.userData.id;
            setPlayersOnPortal(prev => prev.filter(id => id !== playerId));
        }
    };

    return (
        <group position={position}>
            <RigidBody type="fixed" colliders={false}>
                {/* Base */}
                <mesh position={[0, 0.1, 0]} receiveShadow>
                    <cylinderGeometry args={[2, 2.2, 0.2, 32]} />
                    <meshStandardMaterial color="#222" />
                </mesh>

                {/* Glowing Ring */}
                <mesh ref={ringRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.8, 0.1, 16, 32]} />
                    <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={2} />
                </mesh>

                {/* Portal Effect (Inner) */}
                <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[1.8, 1.8, 3, 32, 1, true]} />
                    <meshStandardMaterial
                        color="cyan"
                        transparent
                        opacity={0.2}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Text Label (Billboarding) */}
                <Billboard
                    position={[0, 3.5, 0]}
                    follow={true}
                    lockX={false}
                    lockY={false}
                    lockZ={false}
                >
                    <Text
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="black"
                        font={robotoFont}
                    >
                        {targetMode.toUpperCase()}
                        {'\n'}
                        {countdown !== null ? `Traveling in ${countdown.toFixed(1)}s...` : `${playersOnPortal.length}/${players.length} Players`}
                    </Text>
                </Billboard>

                {/* Sensor */}
                <CylinderCollider
                    args={[1.5, 2]}
                    position={[0, 1.5, 0]}
                    sensor
                    onIntersectionEnter={handleIntersectionEnter}
                    onIntersectionExit={handleIntersectionExit}
                />
            </RigidBody>
        </group>
    );
};

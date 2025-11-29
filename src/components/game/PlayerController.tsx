import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, RapierRigidBody, interactionGroups } from "@react-three/rapier";
import * as THREE from "three";
import { myPlayer, isHost } from "playroomkit";
import type { PlayerState } from "playroomkit";
import { PlayerModel } from "./PlayerModel";
import { useInputStore } from "../../stores/useInputStore";
import { useGameStore } from "../../stores/useGameStore";
import { GameConfig } from "../../config";

interface PlayerControllerProps {
    player: PlayerState;
}

export const PlayerController = ({ player }: PlayerControllerProps) => {
    const isMe = player.id === myPlayer().id;
    const rigidBody = useRef<RapierRigidBody>(null);
    const container = useRef<THREE.Group>(null);

    // Animation State
    const [animState, setAnimState] = useState({
        isMoving: false,
        isJumping: false,
        isJetpacking: false
    });

    // Spell State
    const [activeSpell, setActiveSpell] = useState("fireball");
    const { hp, maxHp, mana, maxMana, setHp, addMana, consumeMana, spellCooldown, setSpellCooldown } = useGameStore();

    // Listen for spell changes (from Tomes)
    useEffect(() => {
        if (!isMe) return;
        const handleSpellChange = (e: any) => {
            performance.mark('spell-change-start');
            setActiveSpell(e.detail);

            requestAnimationFrame(() => {
                performance.mark('spell-change-end');
                performance.measure('Spell Change Time', 'spell-change-start', 'spell-change-end');
                const measure = performance.getEntriesByName('Spell Change Time').pop();
                console.log(`[Perf] Spell Change Time: ${measure?.duration.toFixed(2)}ms`);
            });
        };
        const handlePlayerHit = (e: any) => {
            if (e.detail.playerId === player.id) {
                useGameStore.getState().damagePlayer(e.detail.damage);
            }
        };

        window.addEventListener('change-spell', handleSpellChange);
        window.addEventListener('player-hit', handlePlayerHit);
        return () => {
            window.removeEventListener('change-spell', handleSpellChange);
            window.removeEventListener('player-hit', handlePlayerHit);
        };
    }, [isMe, player.id]);

    // Input Store (only used if isMe)
    const { forward, backward, left, right, jump, fire } = useInputStore();

    // Sync Refs
    const lastSync = useRef(0);
    const jumpHeldTime = useRef(0);
    const jumpedFromGround = useRef(false);
    const cooldownTimer = useRef(0);
    const velocityRef = useRef(new THREE.Vector3()); // Track velocity for animations

    useFrame((state, delta) => {
        if (!rigidBody.current || !container.current) return;

        if (isMe) {
            // Regen
            if (hp < maxHp) {
                setHp(Math.min(maxHp, hp + delta * 2)); // 2 HP per second
            }
            if (mana < maxMana) {
                addMana(delta * 10); // 10 Mana per second
            }

            // Sync Host Status
            if (isHost()) {
                player.setState('isHost', true, true);
            }

            // --- LOCAL CONTROL ---
            const linvel = rigidBody.current.linvel();
            velocityRef.current.set(linvel.x, linvel.y, linvel.z); // Update ref
            const speed = GameConfig.playerSpeed;

            // Get camera forward/right vectors projected on XZ plane
            const camera = state.camera;
            const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forwardDir.y = 0;
            forwardDir.normalize();

            const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            rightDir.y = 0;
            rightDir.normalize();

            const moveDir = new THREE.Vector3();
            if (forward) moveDir.add(forwardDir);
            if (backward) moveDir.sub(forwardDir);
            if (left) moveDir.sub(rightDir);
            if (right) moveDir.add(rightDir);

            // Normalize and apply speed
            const isMovingNow = moveDir.lengthSq() > 0;

            if (isMovingNow) {
                moveDir.normalize().multiplyScalar(speed);

                // Rotate player to face movement direction (Smooth Turn)
                const angle = Math.atan2(moveDir.x, moveDir.z);
                const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

                const currentRotation = rigidBody.current.rotation();
                const currentQuat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w);

                currentQuat.slerp(targetRotation, 15 * delta); // Smooth factor
                rigidBody.current.setRotation(currentQuat, true);
            }

            // Apply movement (Direct velocity control for snappy feel)
            rigidBody.current.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true);

            // Jump & Jetpack Logic
            const isGrounded = Math.abs(linvel.y) < 0.1;
            let isJetpacking = false;

            if (jump) {
                if (jumpHeldTime.current === 0) {
                    // Just started pressing jump
                    jumpedFromGround.current = isGrounded;
                }
                jumpHeldTime.current += delta;

                if (jumpedFromGround.current) {
                    // Started on ground: Jump then wait for Jetpack
                    if (jumpHeldTime.current < 0.1) {
                        // Initial Jump
                        rigidBody.current.applyImpulse({ x: 0, y: GameConfig.playerJumpForce, z: 0 }, true);
                    } else if (jumpHeldTime.current > 0.35) {
                        // Jetpack (Delay 0.35s before activation)
                        const jetpackCost = 20 * delta; // Cost per second
                        if (consumeMana(jetpackCost)) {
                            // Reduced Jetpack Force
                            rigidBody.current.applyImpulse({ x: 0, y: GameConfig.jetpackForce * 0.005, z: 0 }, true);
                            isJetpacking = true;
                        }
                    }
                } else {
                    // Started in air: Jetpack immediately
                    const jetpackCost = 20 * delta; // Cost per second
                    if (consumeMana(jetpackCost)) {
                        // Reduced Jetpack Force
                        rigidBody.current.applyImpulse({ x: 0, y: GameConfig.jetpackForce * 0.005, z: 0 }, true);
                        isJetpacking = true;
                    }
                }
            } else {
                jumpHeldTime.current = 0;
                jumpedFromGround.current = false;
            }

            // Spell Casting Logic
            const COOLDOWN_DURATION = 0.5; // 0.5s cooldown
            // Update Cooldown
            if (cooldownTimer.current > 0) {
                cooldownTimer.current -= delta;
                // Update UI (0 to 1)
                setSpellCooldown(Math.max(0, cooldownTimer.current / COOLDOWN_DURATION));
            } else {
                setSpellCooldown(0);
            }

            if (fire && cooldownTimer.current <= 0) {
                // Check Mana
                const manaCost = 10; // Base cost
                if (consumeMana(manaCost)) {
                    // Reset Cooldown
                    cooldownTimer.current = COOLDOWN_DURATION;
                    setSpellCooldown(1);

                    // Cast Spell
                    const rotation = rigidBody.current.rotation();
                    const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
                    const baseForward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
                    const spawnPos = rigidBody.current.translation();
                    const baseCastPos = new THREE.Vector3(spawnPos.x, spawnPos.y + 0.5, spawnPos.z).add(baseForward.clone().multiplyScalar(1.5));

                    const fireProjectile = (offsetDir: THREE.Vector3, delay: number = 0) => {
                        setTimeout(() => {
                            const castData = {
                                type: activeSpell,
                                position: baseCastPos,
                                direction: offsetDir,
                                playerId: myPlayer().id,
                                timestamp: Date.now()
                            };
                            window.dispatchEvent(new CustomEvent('cast-spell', { detail: castData }));
                            myPlayer().setState('lastCast', castData);
                        }, delay);
                    };

                    if (activeSpell === 'magic_missile') {
                        // 3-Round Burst
                        fireProjectile(baseForward, 0);
                        fireProjectile(baseForward, 100);
                        fireProjectile(baseForward, 200);
                    } else if (activeSpell === 'ice_shard') {
                        // Shotgun Blast (5 shards)
                        for (let i = 0; i < 5; i++) {
                            const spread = new THREE.Vector3(
                                (Math.random() - 0.5) * 0.5,
                                (Math.random() - 0.5) * 0.2, // Less vertical spread
                                (Math.random() - 0.5) * 0.5
                            );
                            const dir = baseForward.clone().add(spread).normalize();
                            fireProjectile(dir, 0);
                        }
                    } else {
                        // Standard Single Shot (Fireball)
                        fireProjectile(baseForward, 0);
                    }

                } else {
                    console.log("Not enough mana!");
                }
            }

            // --- SYNC TO NETWORK ---
            const now = Date.now();
            if (now - lastSync.current > 50) { // 20 FPS
                const pos = rigidBody.current.translation();
                const rot = rigidBody.current.rotation(); // Sync body rotation now

                player.setState("pos", pos, true); // Reliable
                player.setState("rot", { x: rot.x, y: rot.y, z: rot.z, w: rot.w }, true); // Sync Quaternion
                player.setState("anim", {
                    isMoving: isMovingNow,
                    isJumping: !isGrounded,
                    isJetpacking: isJetpacking
                }, true);

                lastSync.current = now;
            }

            // Update Local Anim State for rendering
            const newAnimState = {
                isMoving: isMovingNow,
                isJumping: !isGrounded,
                isJetpacking: isJetpacking
            };

            if (newAnimState.isMoving !== animState.isMoving ||
                newAnimState.isJumping !== animState.isJumping ||
                newAnimState.isJetpacking !== animState.isJetpacking) {
                setAnimState(newAnimState);
            }

        } else {
            // --- REMOTE CONTROL ---
            const pos = player.getState("pos");
            const rot = player.getState("rot");
            const anim = player.getState("anim");

            if (pos) {
                // Interpolate Position
                const currentPos = rigidBody.current.translation();
                const vecPos = new THREE.Vector3(pos.x, pos.y, pos.z);

                // Calculate approximate velocity for remote players
                const dist = vecPos.clone().sub(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z));
                velocityRef.current.copy(dist).divideScalar(delta); // Approx velocity

                // Simple Lerp for Kinematic
                const newPos = new THREE.Vector3().lerpVectors(
                    new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
                    vecPos,
                    10 * delta
                );

                rigidBody.current.setNextKinematicTranslation(newPos);
            }

            if (rot) {
                // Interpolate Rotation
                // We are syncing the Body rotation now (Quaternion)
                const targetRot = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
                const currentRot = rigidBody.current.rotation();
                const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);

                currentQuat.slerp(targetRot, 10 * delta);
                rigidBody.current.setRotation(currentQuat, true);
            }

            if (anim) {
                setAnimState(anim);
            }
        }
    });

    const profile = player.getProfile();
    const color = (profile?.color?.hex || "#ffffff") as string;

    // Memoize userData to prevent RigidBody re-initialization
    const userData = useMemo(() => ({ tag: 'player', id: player.id }), [player.id]);

    // Determine Spawn Position based on Player Index (simple hash or sequential)
    // In a real game, we'd pass index from GameScene or use player.id hash
    const spawnIndex = parseInt(player.id.substr(0, 1), 36) % 4;
    const spawnPositions = [
        [20, 6, 20],   // Red Pillar
        [-20, 6, 20],  // Blue Pillar
        [20, 6, -20],  // Green Pillar
        [-20, 6, -20]  // Yellow Pillar
    ];
    const startPos = spawnPositions[spawnIndex] as [number, number, number];

    return (
        <RigidBody
            ref={rigidBody}
            name={`Player-${player.id}`} // Name for CameraController lookup
            colliders={false}
            type={isMe ? "dynamic" : "kinematicPosition"}
            position={startPos} // Start on Pillar
            enabledRotations={[false, false, false]}
            friction={0}
            userData={userData}
            collisionGroups={interactionGroups(1, [0, 1, 2])} // Group 1 (Player), Collides with 0 (World), 1 (Player), 2 (Projectile)
        >
            <CapsuleCollider args={[0.6, 0.4]} position={[0, 0.5, 0]} />
            <group ref={container} position={[0, -0.8, 0]}>
                <PlayerModel
                    color={color}
                    isMoving={animState.isMoving}
                    isJumping={animState.isJumping}
                    isJetpacking={animState.isJetpacking}
                    velocityRef={velocityRef} // Pass velocity ref
                    cooldown={isMe ? spellCooldown : 0}
                    manaRatio={isMe ? mana / maxMana : 1}
                    hpRatio={isMe ? hp / maxHp : 1}
                />
            </group>
        </RigidBody>
    );
};

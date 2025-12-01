import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, RapierRigidBody, interactionGroups, useBeforePhysicsStep } from "@react-three/rapier";
import * as THREE from "three";
import { myPlayer, isHost } from "playroomkit";
import type { PlayerState } from "playroomkit";
import { PlayerModel } from "./PlayerModel";
import { useInputStore } from "../../stores/useInputStore";
import { useGameStore } from "../../stores/useGameStore";
import { GameConfig } from "../../config";
import { SpellDefinitions } from "../spells/SpellDefinitions";
import { checkSynergy, SynergyMatrix } from "../spells/SynergyDefinitions";

interface PlayerControllerProps {
    player: PlayerState;
}

export const PlayerController = ({ player }: PlayerControllerProps) => {
    const isMe = player.id === myPlayer()?.id;
    const rigidBody = useRef<RapierRigidBody>(null);
    const container = useRef<THREE.Group>(null);

    // Animation State
    const [animState, setAnimState] = useState({
        isMoving: false,
        isJumping: false,
        isJetpacking: false
    });

    // Spell State
    const [primarySpell, setPrimarySpell] = useState("fireball");
    const [secondarySpell, setSecondarySpell] = useState("fireball"); // Default secondary
    const lastUsedSlot = useRef<'primary' | 'secondary'>('primary'); // Track last used slot for replacement

    // Tractor Beam State
    const isInTractorBeam = useRef(false);

    // Init Network State
    useEffect(() => {
        if (isMe) {
            player.setState('primarySpell', primarySpell, true);
            player.setState('secondarySpell', secondarySpell, true);
        }
    }, [isMe]);

    const { hp, maxHp, mana, maxMana, setHp, addMana, consumeMana, spellCooldown, setSpellCooldown, activeEffects, tickEffects, addEffect, removeEffect, spawnPoint, respawnTrigger, triggerRespawn } = useGameStore();

    // Respawn Logic
    const prevRespawnTrigger = useRef(respawnTrigger);
    useEffect(() => {
        if (isMe && rigidBody.current && respawnTrigger !== prevRespawnTrigger.current) {
            rigidBody.current.setTranslation({ x: spawnPoint[0], y: spawnPoint[1], z: spawnPoint[2] }, true);
            rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            prevRespawnTrigger.current = respawnTrigger;
        }
    }, [respawnTrigger, isMe, spawnPoint]); // Triggered by store action

    // Auto-respawn on death (HP <= 0)
    useEffect(() => {
        if (isMe && hp <= 0) {
            triggerRespawn();
        }
    }, [hp, isMe, triggerRespawn]);

    // Listen for spell changes and hits
    useEffect(() => {
        if (!isMe) return;

        const handleSpellChange = (e: any) => {
            const newSpell = e.detail;

            // Replace the spell in the last used slot
            if (lastUsedSlot.current === 'primary') {
                setPrimarySpell(newSpell);
                player.setState('primarySpell', newSpell, true);
                useGameStore.getState().setMySpells({ primary: newSpell });
            } else {
                setSecondarySpell(newSpell);
                player.setState('secondarySpell', newSpell, true);
                useGameStore.getState().setMySpells({ secondary: newSpell });
            }
        };

        const handlePlayerHit = (e: any) => {
            if (e.detail.playerId === player.id) {
                const { damage, spellTags } = e.detail;
                let finalDamage = damage;

                // Check Synergies
                if (spellTags) {
                    const currentEffects = useGameStore.getState().activeEffects;
                    const synergy = checkSynergy(spellTags, currentEffects);

                    if (synergy) {
                        console.log(`[Synergy] ${synergy.name} triggered!`);

                        if (synergy.damageMultiplier) finalDamage *= synergy.damageMultiplier;
                        if (synergy.bonusDamage) finalDamage += synergy.bonusDamage;

                        if (synergy.removeTriggerEffect) {
                            // Find which effect triggered it
                            for (const tag of spellTags) {
                                if (SynergyMatrix[tag]) {
                                    for (const effect of currentEffects) {
                                        if (SynergyMatrix[tag][effect.type] === synergy) {
                                            removeEffect(effect.type);
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        if (synergy.addedEffect) {
                            addEffect(synergy.addedEffect);
                        }
                    }
                }

                useGameStore.getState().damagePlayer(finalDamage);
            }
        };

        const handleTractorBeam = (e: any) => {
            if (e.detail.targetId === player.id) {
                isInTractorBeam.current = e.detail.active;
            }
        };

        window.addEventListener('change-spell', handleSpellChange);
        window.addEventListener('player-hit', handlePlayerHit);
        window.addEventListener('tractor-beam', handleTractorBeam);
        return () => {
            window.removeEventListener('change-spell', handleSpellChange);
            window.removeEventListener('player-hit', handlePlayerHit);
            window.removeEventListener('tractor-beam', handleTractorBeam);
        };
    }, [isMe, player.id]);

    // Input Store (only used if isMe)
    const { forward, backward, left, right, jump, fire, altFire } = useInputStore();
    const isMiningMode = useGameStore(state => state.gameMode === 'mining');

    // Slap Attack State
    const [isSlapping, setIsSlapping] = useState(false);
    const slapInterval = useRef<any>(null);

    // Handle Slap Input
    useEffect(() => {
        if (!isMe || !isMiningMode) return;

        if (fire) {
            if (!isSlapping) {
                setIsSlapping(true);
                // Start Slapping Loop
                const slap = () => {
                    // Raycast forward to find Crystal
                    if (rigidBody.current) {
                        const origin = rigidBody.current.translation();
                        // const rotation = rigidBody.current.rotation();
                        // Calculate forward direction from rotation
                        // const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)).normalize();

                        // Simple distance check to center (0,0,0) where crystal is
                        // In a real implementation, we would use a raycast
                        const distToCenter = Math.sqrt(origin.x * origin.x + origin.z * origin.z);

                        if (distToCenter < 6) {
                            window.dispatchEvent(new CustomEvent('mine-crystal', { detail: { playerId: player.id, damage: 10 } }));
                        }
                    }
                };

                slap(); // Initial slap
                slapInterval.current = setInterval(slap, 500); // Slap every 500ms
            }
        } else {
            if (isSlapping) {
                setIsSlapping(false);
                if (slapInterval.current) clearInterval(slapInterval.current);
            }
        }

        return () => {
            if (slapInterval.current) clearInterval(slapInterval.current);
        };
    }, [isMe, isMiningMode, fire, isSlapping]);

    // Sync Refs
    const lastSync = useRef(0);
    const jumpHeldTime = useRef(0);
    const jumpedFromGround = useRef(false);
    const cooldownTimer = useRef(0);
    const maxCooldownRef = useRef(0.5);
    const velocityRef = useRef(new THREE.Vector3()); // Track velocity for animations

    // Capture Camera Rotation for Physics Step
    const cameraQuat = useRef(new THREE.Quaternion());
    useFrame((state) => {
        cameraQuat.current.copy(state.camera.quaternion);
    });

    // Ref to pass state from Physics to Render
    const animStateRef = useRef({ isMoving: false, isJumping: false, isJetpacking: false });

    useBeforePhysicsStep(() => {
        if (!rigidBody.current || !isMe) return;

        const delta = 1 / 60; // Fixed Step

        // --- REGEN & EFFECTS ---
        tickEffects(delta);
        if (hp < maxHp) setHp(Math.min(maxHp, hp + delta * 2));
        if (mana < maxMana) addMana(delta * 10);

        // --- MOVEMENT ---
        const linvel = rigidBody.current.linvel();
        velocityRef.current.set(linvel.x, linvel.y, linvel.z);

        // Calculate Speed Modifier
        let speedMod = 1;
        const slowEffect = activeEffects.find(e => e.type === 'slow');
        if (slowEffect) speedMod -= (slowEffect.intensity || 0.3);

        const speed = GameConfig.playerSpeed * Math.max(0.1, speedMod);

        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuat.current);
        forwardDir.y = 0;
        forwardDir.normalize();

        const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuat.current);
        rightDir.y = 0;
        rightDir.normalize();

        const moveDir = new THREE.Vector3();
        if (forward) moveDir.add(forwardDir);
        if (backward) moveDir.sub(forwardDir);
        if (left) moveDir.sub(rightDir);
        if (right) moveDir.add(rightDir);

        const isMovingNow = moveDir.lengthSq() > 0;

        if (isMovingNow) {
            moveDir.normalize().multiplyScalar(speed);

            // Rotate player
            const angle = Math.atan2(moveDir.x, moveDir.z);
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            const currentRotation = rigidBody.current.rotation();
            const currentQuat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w);
            currentQuat.slerp(targetRotation, 15 * delta);
            rigidBody.current.setRotation(currentQuat, true);
        }

        rigidBody.current.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true);

        // --- TRACTOR BEAM ---
        if (isInTractorBeam.current) {
            rigidBody.current.applyImpulse({ x: 0, y: 0.5, z: 0 }, true);
            // Damping to prevent infinite acceleration
            if (linvel.y > 5) {
                rigidBody.current.setLinvel({ x: linvel.x, y: 5, z: linvel.z }, true);
            }
        }

        // --- JUMP & JETPACK ---
        const isGrounded = Math.abs(linvel.y) < 0.1;
        let isJetpacking = false;

        if (jump) {
            if (jumpHeldTime.current === 0) {
                jumpedFromGround.current = isGrounded;
            }
            jumpHeldTime.current += delta;

            if (jumpedFromGround.current) {
                if (jumpHeldTime.current < 0.1) {
                    rigidBody.current.applyImpulse({ x: 0, y: GameConfig.playerJumpForce, z: 0 }, true);
                } else if (jumpHeldTime.current > 0.35) {
                    const jetpackCost = 20 * delta;
                    if (consumeMana(jetpackCost)) {
                        rigidBody.current.applyImpulse({ x: 0, y: GameConfig.jetpackForce * 0.005, z: 0 }, true);
                        isJetpacking = true;
                    }
                }
            } else {
                const jetpackCost = 20 * delta;
                if (consumeMana(jetpackCost)) {
                    rigidBody.current.applyImpulse({ x: 0, y: GameConfig.jetpackForce * 0.005, z: 0 }, true);
                    isJetpacking = true;
                }
            }
        } else {
            jumpHeldTime.current = 0;
            jumpedFromGround.current = false;
        }

        // --- SPELL COOLDOWN ---
        if (cooldownTimer.current > 0) {
            cooldownTimer.current -= delta;
            setSpellCooldown(Math.max(0, cooldownTimer.current / maxCooldownRef.current));
        } else {
            setSpellCooldown(0);
        }

        // --- SPELL CASTING (Generic Data-Driven) ---
        const tryCastSpell = (spellType: string, slot: 'primary' | 'secondary') => {
            if (cooldownTimer.current > 0) return;

            const spellConfig = SpellDefinitions[spellType as keyof typeof SpellDefinitions];
            if (!spellConfig) return;

            const behavior = spellConfig.castBehavior || {};
            const manaCost = behavior.manaCost || 10;
            const cooldown = behavior.cooldown || 0.5;
            const count = behavior.count || 1;
            const spread = behavior.spread || 0;
            const spreadType = behavior.spreadType || 'random';
            const burstCount = behavior.burstCount || 1;
            const burstDelay = behavior.burstDelay || 0;
            const startOffset = behavior.startOffset || 1.5;

            if (consumeMana(manaCost)) {
                cooldownTimer.current = cooldown;
                maxCooldownRef.current = cooldown; // Update max for UI
                setSpellCooldown(1);
                lastUsedSlot.current = slot;

                if (!rigidBody.current) return;

                // Capture initial state for the burst
                const rotation = rigidBody.current.rotation();
                const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
                const baseForward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
                const spawnPos = rigidBody.current.translation();
                const baseCastPos = new THREE.Vector3(spawnPos.x, spawnPos.y + 0.5, spawnPos.z).add(baseForward.clone().multiplyScalar(startOffset));

                // Helper to fire a single shot
                const fireShot = (delay: number) => {
                    setTimeout(() => {
                        for (let i = 0; i < count; i++) {
                            let dir = baseForward.clone();

                            // Apply Spread
                            if (spread > 0) {
                                if (spreadType === 'random') {
                                    const spreadVec = new THREE.Vector3(
                                        (Math.random() - 0.5) * (spread * 0.02), // Approx conversion to radians/vector
                                        (Math.random() - 0.5) * (spread * 0.01),
                                        (Math.random() - 0.5) * (spread * 0.02)
                                    );
                                    dir.add(spreadVec).normalize();
                                } else {
                                    // Linear spread (e.g. fan) - simple implementation
                                    const angle = ((i / (count - 1 || 1)) - 0.5) * (spread * 0.01745); // Degrees to radians
                                    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                                }
                            }

                            const castData = {
                                type: spellType,
                                position: baseCastPos,
                                direction: dir,
                                playerId: myPlayer().id,
                                timestamp: Date.now()
                            };
                            window.dispatchEvent(new CustomEvent('cast-spell', { detail: castData }));
                            myPlayer().setState('lastCast', castData);
                        }
                    }, delay);
                };

                // Execute Burst
                for (let b = 0; b < burstCount; b++) {
                    fireShot(b * burstDelay);
                }
            }
        };

        if (fire) {
            tryCastSpell(primarySpell, 'primary');
        } else if (altFire) {
            tryCastSpell(secondarySpell, 'secondary');
        }

        // Update Anim State Ref for useFrame to pick up
        animStateRef.current = {
            isMoving: isMovingNow,
            isJumping: !isGrounded,
            isJetpacking: isJetpacking
        };
    });

    useFrame((_, delta) => {
        if (!rigidBody.current || !container.current) return;

        if (isMe) {
            // Sync Host Status
            if (isHost()) {
                player.setState('isHost', true, true);
            }

            // Wake up rigid body to ensure physics updates
            if (rigidBody.current.isSleeping()) {
                rigidBody.current.wakeUp();
            }

            // --- SYNC TO NETWORK ---
            const now = Date.now();
            if (now - lastSync.current > 50) { // 20 FPS
                const pos = rigidBody.current.translation();
                const rot = rigidBody.current.rotation();

                player.setState("pos", pos, true);
                player.setState("rot", { x: rot.x, y: rot.y, z: rot.z, w: rot.w }, true);
                player.setState("anim", animStateRef.current, true);
                player.setState("activeEffects", activeEffects, true);

                lastSync.current = now;
            }

            // Update Local Anim State for rendering
            const newAnimState = animStateRef.current;
            if (newAnimState.isMoving !== animState.isMoving ||
                newAnimState.isJumping !== animState.isJumping ||
                newAnimState.isJetpacking !== animState.isJetpacking) {
                setAnimState(newAnimState);
            }

        } else {
            // --- REMOTE CONTROL ---
            // (Keep existing interpolation logic)
            const pos = player.getState("pos");
            const rot = player.getState("rot");
            const anim = player.getState("anim");

            if (pos) {
                const currentPos = rigidBody.current.translation();
                const vecPos = new THREE.Vector3(pos.x, pos.y, pos.z);
                const dist = vecPos.clone().sub(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z));
                velocityRef.current.copy(dist).divideScalar(delta);

                const newPos = new THREE.Vector3().lerpVectors(
                    new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z),
                    vecPos,
                    10 * delta
                );
                rigidBody.current.setNextKinematicTranslation(newPos);
            }

            if (rot) {
                const targetRot = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
                const currentRot = rigidBody.current.rotation();
                const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
                currentQuat.slerp(targetRot, 10 * delta);
                rigidBody.current.setRotation(currentQuat, true);
            }

            if (anim) {
                setAnimState(anim);
            }

            // Sync Spells
            const pSpell = player.getState("primarySpell");
            if (pSpell && pSpell !== primarySpell) setPrimarySpell(pSpell);

            const sSpell = player.getState("secondarySpell");
            if (sSpell && sSpell !== secondarySpell) setSecondarySpell(sSpell);
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
                    isSlapping={isSlapping}
                    velocityRef={velocityRef} // Pass velocity ref
                    cooldown={isMe ? spellCooldown : 0}
                    manaRatio={isMe ? mana / maxMana : 1}
                    hpRatio={isMe ? hp / maxHp : 1}
                    leftHandColor={SpellDefinitions[secondarySpell as keyof typeof SpellDefinitions]?.color || "gray"}
                    rightHandColor={SpellDefinitions[primarySpell as keyof typeof SpellDefinitions]?.color || "gray"}
                    activeEffects={isMe ? activeEffects : (player.getState("activeEffects") || [])}
                />
            </group>
        </RigidBody>
    );
};

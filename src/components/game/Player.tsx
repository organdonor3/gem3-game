import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { useInputStore } from '../../stores/useInputStore';
import { useGameStore } from '../../stores/useGameStore';
import { GameConfig } from '../../config';
import * as THREE from 'three';
import { myPlayer } from "playroomkit";
import { PlayerModel } from './PlayerModel';

export const Player = forwardRef<RapierRigidBody>((_, ref) => {
    const body = useRef<RapierRigidBody>(null);
    const { forward, backward, left, right, jump, fire } = useInputStore();

    // Animation State
    const [isMoving, setIsMoving] = useState(false);
    const [isJumping, setIsJumping] = useState(false);
    const [isJetpacking, setIsJetpacking] = useState(false);

    // Spell State
    const [activeSpell, setActiveSpell] = useState("fireball");
    const wasFiring = useRef(false);

    const { hp, maxHp, mana, maxMana, setHp, setMana, consumeMana } = useGameStore();

    // Listen for spell changes (from Tomes)
    useEffect(() => {
        const handleSpellChange = (e: any) => setActiveSpell(e.detail);
        window.addEventListener('change-spell', handleSpellChange);
        return () => window.removeEventListener('change-spell', handleSpellChange);
    }, []);

    // Expose the internal ref to the parent
    useImperativeHandle(ref, () => body.current!);

    // Network Sync Rate Limiting
    const lastSync = useRef(0);

    useFrame((state, delta) => {
        if (!body.current) return;

        // Regen
        if (hp < maxHp) {
            setHp(Math.min(maxHp, hp + delta * 2)); // 2 HP per second
        }
        if (mana < maxMana) {
            setMana(Math.min(maxMana, mana + delta * 10)); // 10 Mana per second
        }

        // Movement
        const linvel = body.current.linvel();
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
        setIsMoving(isMovingNow);

        if (isMovingNow) {
            moveDir.normalize().multiplyScalar(speed);

            // Rotate player to face movement direction
            const angle = Math.atan2(moveDir.x, moveDir.z);
            const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            body.current.setRotation(rotation, true);
        }

        // Apply movement
        body.current.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true);

        // Jump & Jetpack
        const isGrounded = Math.abs(linvel.y) < 0.1;
        setIsJumping(!isGrounded);

        if (jump) {
            if (isGrounded) {
                // Initial Jump
                body.current.applyImpulse({ x: 0, y: GameConfig.playerJumpForce, z: 0 }, true);
                import('../../systems/AudioManager').then(({ audioManager }) => audioManager.play('jump'));
                setIsJetpacking(false);
            } else {
                // Jetpack (Apply force while holding jump in air)
                // Add a small upward force to counteract gravity + lift
                body.current.applyImpulse({ x: 0, y: GameConfig.jetpackForce * 0.02, z: 0 }, true);
                setIsJetpacking(true);
            }
        } else {
            setIsJetpacking(false);
        }

        // Spell Casting Logic
        if (fire && !wasFiring.current) {
            // Check Mana
            const manaCost = 10; // Base cost
            if (consumeMana(manaCost)) {
                // Cast Spell
                if (body.current) {
                    // Get character forward direction
                    const rotation = body.current.rotation();
                    const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();

                    // Spawn position slightly in front
                    const spawnPos = body.current.translation();
                    const castPos = new THREE.Vector3(spawnPos.x, spawnPos.y + 0.5, spawnPos.z).add(forward.multiplyScalar(1.5));

                    const castData = {
                        type: activeSpell,
                        position: castPos,
                        direction: forward,
                        playerId: myPlayer().id,
                        timestamp: Date.now()
                    };

                    // Local Event
                    window.dispatchEvent(new CustomEvent('cast-spell', { detail: castData }));

                    // Network Broadcast
                    myPlayer().setState('lastCast', castData);
                }
            } else {
                // Not enough mana feedback?
                console.log("Not enough mana!");
            }
        }

        wasFiring.current = fire;

        // Sync with Playroom (Throttled)
        const now = Date.now();
        if (now - lastSync.current > 50) { // 20 FPS
            const playerPos = body.current.translation();
            const playerRot = body.current.rotation();

            // Force reliable: true to bypass WebRTC issues (ICE failed)
            myPlayer().setState("pos", playerPos, true);
            myPlayer().setState("rot", playerRot, true);
            myPlayer().setState("anim", {
                isMoving: isMovingNow,
                isJumping: !isGrounded,
                isJetpacking: jump && !isGrounded
            }, true);
            myPlayer().setState("initialized", true, true); // Handshake must be reliable
            lastSync.current = now;
        }
    });

    // Spawn Points
    const SPAWN_POINTS = [
        [0, 5, 5],   // Player 1
        [0, 5, -5],  // Player 2
        [5, 5, 0],   // Player 3
        [-5, 5, 0]   // Player 4
    ];

    // Determine Spawn Point
    useEffect(() => {
        if (body.current) {
            // Temporary: Randomize slightly to avoid perfect stacking if logic fails
            const index = Math.floor(Math.random() * 4);
            const spawn = SPAWN_POINTS[index];
            body.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
        }
    }, []);

    return (
        <RigidBody
            ref={body}
            colliders={false}
            enabledRotations={[false, false, false]}
            position={[0, 10, 0]} // Initial high position before effect runs
        >
            <CapsuleCollider args={[0.5, 0.5]} />
            {/* Visual Model */}
            <group position={[0, -0.5, 0]}> {/* Offset to align with collider bottom */}
                <PlayerModel
                    color={(myPlayer().getProfile()?.color?.hex || "#ffffff") as string}
                    isMoving={isMoving}
                    isJumping={isJumping}
                    isJetpacking={isJetpacking}
                />
            </group>
        </RigidBody>
    );
});

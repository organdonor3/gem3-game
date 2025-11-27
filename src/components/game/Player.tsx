import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { useInputStore } from '../../stores/useInputStore';
import { GameConfig } from '../../config';
import * as THREE from 'three';
import { myPlayer } from "playroomkit";

export const Player = () => {
    const body = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const { forward, backward, left, right, jump } = useInputStore();

    useFrame((state) => {
        if (!body.current) return;

        // Movement
        const impulse = { x: 0, y: 0, z: 0 };
        const linvel = body.current.linvel();
        const speed = GameConfig.playerSpeed;

        if (forward) impulse.z -= speed;
        if (backward) impulse.z += speed;
        if (left) impulse.x -= speed;
        if (right) impulse.x += speed;

        // Apply movement (simple direct velocity control for responsiveness)
        body.current.setLinvel({ x: impulse.x, y: linvel.y, z: impulse.z }, true);

        // Jump
        if (jump && Math.abs(linvel.y) < 0.1) {
            body.current.applyImpulse({ x: 0, y: GameConfig.playerJumpForce, z: 0 }, true);
            import('../../systems/AudioManager').then(({ audioManager }) => audioManager.play('jump'));
        }

        // Camera Follow
        const playerPos = body.current.translation();
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        const targetPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).add(cameraOffset);

        state.camera.position.lerp(targetPos, 0.1);
        state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);

        // Sync with Playroom
        myPlayer().setState("pos", playerPos);

        // Squash & Stretch Animation
        if (meshRef.current) {
            const stretch = Math.max(1, 1 + Math.abs(linvel.y) * 0.05);
            const squash = 1 / Math.sqrt(stretch); // Maintain volume
            meshRef.current.scale.lerp(new THREE.Vector3(squash, stretch, squash), 0.1);
        }
    });

    return (
        <RigidBody
            ref={body}
            colliders={false}
            enabledRotations={[false, false, false]}
            position={[0, 5, 0]}
        >
            <CapsuleCollider args={[0.5, 0.5]} />
            <mesh ref={meshRef} castShadow>
                <capsuleGeometry args={[0.5, 1, 4, 8]} />
                <meshStandardMaterial color="cyan" />
            </mesh>
        </RigidBody>
    );
};

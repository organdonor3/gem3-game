import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { GameConfig } from '../../config';
import * as THREE from 'three';

export const Player = () => {
    const body = useRef<RapierRigidBody>(null);
    const { forward, backward, left, right, jump } = useKeyboardControls();

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
        }

        // Camera Follow
        const playerPos = body.current.translation();
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        const targetPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).add(cameraOffset);

        state.camera.position.lerp(targetPos, 0.1);
        state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    });

    return (
        <RigidBody
            ref={body}
            colliders={false}
            enabledRotations={[false, false, false]}
            position={[0, 5, 0]}
        >
            <CapsuleCollider args={[0.5, 0.5]} />
            <mesh castShadow>
                <capsuleGeometry args={[0.5, 1, 4, 8]} />
                <meshStandardMaterial color="cyan" />
            </mesh>
        </RigidBody>
    );
};

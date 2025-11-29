import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { myPlayer } from "playroomkit";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export const CameraController = () => {
    const { scene } = useThree();
    const controlsRef = useRef<any>(null);
    const targetRef = useRef<Vector3>(new Vector3());

    useFrame((_, delta) => {
        // Find the local player's object in the scene
        const myId = myPlayer().id;
        const playerObject = scene.getObjectByName(`Player-${myId}`);

        if (playerObject && controlsRef.current) {
            const playerPos = playerObject.getWorldPosition(new Vector3());

            // Smoothly interpolate camera target
            targetRef.current.lerp(playerPos, 10 * delta);
            controlsRef.current.target.copy(targetRef.current);
            controlsRef.current.update();
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.1}
            minDistance={5}
            maxDistance={20}
            mouseButtons={{
                LEFT: undefined, // Disable Left Click
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE
            }}
        />
    );
};

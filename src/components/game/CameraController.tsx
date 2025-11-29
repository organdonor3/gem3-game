import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Vector3 } from "three";
import { myPlayer } from "playroomkit";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export const CameraController = () => {
    const { scene, gl } = useThree();
    const controlsRef = useRef<any>(null);
    const targetRef = useRef<Vector3>(new Vector3());

    useEffect(() => {
        const onMouseDown = () => {
            gl.domElement.requestPointerLock();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (document.pointerLockElement === gl.domElement && controlsRef.current) {
                const controls = controlsRef.current;
                const camera = controls.object;
                const target = controls.target;

                const sensitivity = 0.002;

                // Calculate offset from target
                const offset = new THREE.Vector3().copy(camera.position).sub(target);

                // Convert to Spherical
                const spherical = new THREE.Spherical().setFromVector3(offset);

                // Apply rotation
                // Theta is horizontal (azimuth), Phi is vertical (polar)
                spherical.theta -= e.movementX * sensitivity;
                spherical.phi -= e.movementY * sensitivity;

                // Clamp Phi to avoid flipping (standard OrbitControls limits)
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

                // Convert back
                offset.setFromSpherical(spherical);

                // Apply to camera
                camera.position.copy(target).add(offset);

                // Sync controls
                controls.update();
            }
        };

        const domElement = gl.domElement;
        domElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            domElement.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, [gl]);

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
                RIGHT: undefined // Disable default Right Click Rotate (handled manually)
            }}
        />
    );
};

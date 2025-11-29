import { useRef, useLayoutEffect, useState, useMemo } from "react";
import { useFrame, useThree, createPortal } from "@react-three/fiber";
import * as THREE from "three";

interface DynamicShadowProps {
    scale?: number;
    opacity?: number;
    color?: string;
}

export const DynamicShadow = ({ scale = 1, opacity = 0.6, color = "#000000" }: DynamicShadowProps) => {
    const { scene } = useThree();
    const shadowRef = useRef<THREE.Mesh>(null);
    const trackerRef = useRef<THREE.Group>(null);
    const [parent, setParent] = useState<THREE.Object3D | null>(null);

    useLayoutEffect(() => {
        if (trackerRef.current) {
            setParent(trackerRef.current.parent);
        }
    }, []);

    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);

    useFrame(() => {
        if (!parent || !shadowRef.current) return;

        const worldPos = new THREE.Vector3();
        parent.getWorldPosition(worldPos);

        // Raycast down to find ground
        raycaster.set(worldPos, down);

        // Intersect with everything in the scene
        const intersects = raycaster.intersectObjects(scene.children, true);

        let groundY = 0;
        let hitFound = false;

        for (const hit of intersects) {
            // Ignore self (shadow) and parent (player/enemy)
            if (hit.object.uuid !== shadowRef.current.uuid &&
                !parent.getObjectByProperty('uuid', hit.object.uuid) &&
                hit.object.userData?.tag !== 'player' && // Explicitly ignore players
                hit.object.userData?.tag !== 'enemy'     // Explicitly ignore enemies
            ) {
                groundY = hit.point.y;
                hitFound = true;
                break;
            }
        }

        if (!hitFound) {
            // Fallback to Y=0 if nothing hit (e.g. over void)
            groundY = 0;
        }

        // Position shadow slightly above ground to avoid z-fighting
        shadowRef.current.position.set(worldPos.x, groundY + 0.02, worldPos.z);

        // Always keep flat rotation
        shadowRef.current.rotation.set(-Math.PI / 2, 0, 0);

        // Scale and Opacity based on height from ground
        const height = Math.max(0, worldPos.y - groundY);
        const distFactor = Math.max(0, 1 - height * 0.1); // Fade out over 10 units

        // Shrink slightly as it goes up, but mostly fade
        const sizeFactor = Math.max(0.2, 1 - height * 0.05);
        shadowRef.current.scale.setScalar(scale * sizeFactor);

        const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
            mat.opacity = opacity * distFactor;
        }
    });

    return (
        <group ref={trackerRef}>
            {createPortal(
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.5, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
                </mesh>,
                scene
            )}
        </group>
    );
};

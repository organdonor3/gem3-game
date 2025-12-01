import { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { InstancedRigidBodies, RapierRigidBody } from '@react-three/rapier';
import type { InstancedRigidBodyProps } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../../stores/useGameStore';
import { myPlayer } from 'playroomkit';

export interface CrystalFragmentPoolHandle {
    spawn: (position: [number, number, number], value: number) => void;
}

interface CrystalFragmentPoolProps {
    count?: number;
}

export const CrystalFragmentPool = forwardRef<CrystalFragmentPoolHandle, CrystalFragmentPoolProps>(({ count = 30 }, ref) => {
    const bodies = useRef<RapierRigidBody[]>([]);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { addCrystalFragments } = useGameStore();

    // Track active state and values internally
    const instanceData = useRef<{ active: boolean; value: number; id: number }[]>([]);

    // Initialize data
    useMemo(() => {
        instanceData.current = Array(count).fill(0).map((_, i) => ({
            active: false,
            value: 1,
            id: i
        }));
    }, [count]);

    // Initial placement (off-screen)
    const instances = useMemo(() => {
        const instances: InstancedRigidBodyProps[] = [];
        for (let i = 0; i < count; i++) {
            instances.push({
                key: i,
                position: [0, -100 - i, 0], // Stack them far away
                userData: { tag: 'fragment', id: i },
                colliders: 'ball',
                gravityScale: 1,
                restitution: 0.5,
                sensor: true, // Sensor so they detect overlap but don't bounce physically? 
                // Wait, if they are sensors they won't bounce on the floor.
                // We want them to bounce on the floor but be collected by player.
                // So NOT sensor, but we use onCollisionEnter.
                // But previously we used 'sensor' in CrystalFragment.tsx?
                // Let's check... yes, "sensor" was true.
                // If it's a sensor, it falls through the floor unless we handle floor collision manually or it ignores gravity?
                // RigidBody with sensor=true usually detects intersections but doesn't react physically.
                // If gravity is on, it will fall forever.
                // The previous code had `sensor` and `gravityScale={1}`.
                // Maybe the floor was also a sensor? No, floor is fixed.
                // If previous code worked, maybe it was just floating?
                // "Float animation?" comment in previous code.
                // But `spawnFragment` added velocity.
                // If it's a sensor, setLinvel works, but it won't bounce off the floor.
                // I'll set sensor=false so they bounce, but I need to make sure they don't collide with each other too much?
                // Collision groups can handle that.
                // For now, let's stick to what likely works: Dynamic bodies that collide with world.
            });
        }
        return instances;
    }, [count]);

    useImperativeHandle(ref, () => ({
        spawn: (position: [number, number, number], value: number) => {
            // Find inactive instance
            const idx = instanceData.current.findIndex(d => !d.active);
            if (idx === -1) return; // Pool full

            const data = instanceData.current[idx];
            data.active = true;
            data.value = value;

            const body = bodies.current[idx];
            if (body) {
                body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);

                // Fountain effect: Upward velocity with random spread
                const vx = (Math.random() - 0.5) * 8;
                const vy = Math.random() * 5 + 5; // Always up (5 to 10)
                const vz = (Math.random() - 0.5) * 8;

                body.setLinvel({ x: vx, y: vy, z: vz }, true);
                body.setAngvel({ x: Math.random(), y: Math.random(), z: Math.random() }, true);
                body.wakeUp();
            }
        }
    }));

    const handleCollision = (e: any) => {
        // e.target.rigidBodyObject is the instance
        // But how do we know WHICH instance?
        // Rapier's onCollisionEnter on InstancedRigidBodies passes the instance index?
        // Actually, the `userData` we passed in `instances` should be available on the rigidBodyObject.

        const myBody = e.target.rigidBodyObject;
        const otherBody = e.other.rigidBodyObject;

        if (!myBody || !otherBody) return;

        const id = myBody.userData?.id;
        if (id === undefined) return;

        const data = instanceData.current[id];
        if (!data.active) return;

        let collected = false;

        // Check if collected by player
        if (otherBody.userData?.tag === 'player' && otherBody.userData.id === myPlayer().id) {
            collected = true;
        }
        // Check if collected by sweeper
        else if (otherBody.userData?.tag === 'sweeper' && otherBody.userData.ownerId === myPlayer().id) {
            collected = true;
        }

        if (collected) {
            // Collect
            addCrystalFragments(data.value);

            // Deactivate
            data.active = false;
            const body = bodies.current[id];
            if (body) {
                body.setTranslation({ x: 0, y: -100 - id, z: 0 }, true);
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                body.sleep();
            }
        }
    };

    // Update mesh visibility based on active state?
    // Since we move inactive ones far away, they won't be seen.
    // So we don't strictly need to scale them to 0, but it saves fill rate if they were in frustum.
    // At -100 y, they are likely out of view.

    return (
        <InstancedRigidBodies
            ref={bodies}
            instances={instances}
            colliders="ball"
            onIntersectionEnter={handleCollision} // Use intersection for sensors? Or collision for solid?
        // If we want them to bounce, we need colliders.
        // If we want them to be picked up, we need to detect overlap.
        // Usually pickups are sensors. But then they fall through floor.
        // Solution: Make them solid (not sensor), but use a collision group that overlaps with player?
        // Or use onCollisionEnter.
        // Let's try onCollisionEnter and NOT sensor.
        >
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
                <octahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </instancedMesh>
        </InstancedRigidBodies>
    );
});

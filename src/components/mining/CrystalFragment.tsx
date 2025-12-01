import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../../stores/useGameStore';
import { myPlayer } from 'playroomkit';

export interface CrystalFragmentHandle {
    activate: (position: [number, number, number], value: number) => void;
    deactivate: () => void;
    isActive: () => boolean;
}

interface CrystalFragmentProps {
    id: number;
    onCollect: (id: number) => void;
}

export const CrystalFragment = forwardRef<CrystalFragmentHandle, CrystalFragmentProps>(({ id, onCollect }, ref) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const { addCrystalFragments } = useGameStore();
    const [active, setActive] = useState(false);
    const [value, setValue] = useState(1);

    useImperativeHandle(ref, () => ({
        activate: (pos: [number, number, number], val: number) => {
            setActive(true);
            setValue(val);
            if (rigidBody.current) {
                rigidBody.current.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);
                const vx = (Math.random() - 0.5) * 4;
                const vy = Math.random() * 4 + 2;
                const vz = (Math.random() - 0.5) * 4;
                rigidBody.current.setLinvel({ x: vx, y: vy, z: vz }, true);
                rigidBody.current.setAngvel({ x: Math.random(), y: Math.random(), z: Math.random() }, true);
                rigidBody.current.wakeUp();
            }
        },
        deactivate: () => {
            setActive(false);
            if (rigidBody.current) {
                rigidBody.current.setTranslation({ x: 0, y: -100, z: 0 }, true);
                rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                rigidBody.current.sleep();
            }
        },
        isActive: () => active
    }));

    const handleIntersection = (e: any) => {
        if (!active) return;

        const other = e.other.rigidBodyObject;
        if (other) {
            if (other.userData?.tag === 'player' && other.userData.id === myPlayer().id) {
                addCrystalFragments(value);
                onCollect(id);
            } else if (other.userData?.tag === 'sweeper' && other.userData.ownerId === myPlayer().id) {
                addCrystalFragments(value);
                onCollect(id);
            }
        }
    };

    return (
        <RigidBody
            ref={rigidBody}
            position={[0, -100, 0]}
            colliders="ball"
            sensor
            onIntersectionEnter={handleIntersection}
            gravityScale={1}
            restitution={0.5}
            userData={{ tag: 'fragment' }}
        >
            <mesh castShadow visible={active}>
                <octahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
            </mesh>
            {active && <pointLight color="#00ffff" intensity={1} distance={2} />}
        </RigidBody>
    );
});

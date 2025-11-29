import React, { useRef, useMemo, useEffect } from 'react';
import { RigidBody, RapierRigidBody, interactionGroups, useBeforePhysicsStep } from '@react-three/rapier';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useSpellCollision } from '../hooks/useSpellCollision';
import { useSpellAssets } from '../SpellAssetsContext';
import { SpellDefinitions } from '../SpellDefinitions';
import type { ProjectileSpellConfig } from '../SpellDefinitions';

interface ProjectileSpellProps {
    spell: {
        id: string;
        type: any; // Typed in Manager, but here we cast
        position: THREE.Vector3;
        direction: THREE.Vector3;
        playerId: string;
    };
    onRemove: () => void;
    enemiesRef: React.MutableRefObject<any[]>;
}

export const ProjectileSpell = React.memo(({ spell, onRemove, enemiesRef }: ProjectileSpellProps) => {
    const config = SpellDefinitions[spell.type as keyof typeof SpellDefinitions] as ProjectileSpellConfig;
    const { speed, gravity = 0, color } = config;

    const ref = useRef<RapierRigidBody>(null);
    const { handleCollision, friendlyFire } = useSpellCollision(spell.type, spell.playerId, onRemove);
    const { magicMissileGeometry, magicMissileMaterial, fireballGeometry, fireballMaterial, iceShardGeometry, iceShardMaterial } = useSpellAssets();

    // Tracking Logic (Magic Missile)
    const isMagicMissile = spell.type === 'magic_missile';
    const targetIdRef = useRef<string | null>(null);
    const { scene } = useThree();

    useBeforePhysicsStep(() => {
        if (!ref.current || !isMagicMissile) return;

        const delta = 1 / 60;
        const currentPos = ref.current.translation();
        let targetPos = new THREE.Vector3();
        let hasTarget = false;

        // 1. Try to track locked target
        if (targetIdRef.current) {
            const targetObj = scene.getObjectByName(targetIdRef.current);
            if (targetObj) {
                targetObj.getWorldPosition(targetPos);
                hasTarget = true;
            } else {
                targetIdRef.current = null;
            }
        }

        // 2. Find new target if none locked
        if (!hasTarget && enemiesRef.current && enemiesRef.current.length > 0) {
            let closestDist = Infinity;
            let bestTargetId = null;

            enemiesRef.current.forEach((e: any) => {
                if (e.hp <= 0) return;
                const ePos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
                const dist = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).distanceTo(ePos);

                if (dist < closestDist && dist < 30) {
                    closestDist = dist;
                    bestTargetId = e.id;
                    targetPos.copy(ePos);
                }
            });

            if (bestTargetId) {
                targetIdRef.current = bestTargetId;
                hasTarget = true;
            }
        }

        if (hasTarget) {
            const dir = targetPos.clone().sub(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)).normalize();
            const currentVel = ref.current.linvel();
            const currentDir = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z).normalize();
            const newDir = currentDir.lerp(dir, delta * 10).normalize();
            ref.current.setLinvel(newDir.multiplyScalar(speed), true);
        } else {
            const currentVel = ref.current.linvel();
            const currentDir = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z).normalize();
            ref.current.setLinvel(currentDir.multiplyScalar(speed), true);
        }
    });

    useEffect(() => {
        if (ref.current) {
            const vel = spell.direction.clone().multiplyScalar(speed);
            ref.current.setLinvel(vel, true);
        }
        const timer = setTimeout(onRemove, 3000);
        return () => clearTimeout(timer);
    }, []);

    const isFireball = spell.type === 'fireball';
    const restitution = isFireball ? 0.8 : 0;
    const friction = isFireball ? 0.5 : 0;

    // Collision Groups
    const collisionMask = friendlyFire ? [0, 1] : [0];

    // Visual Selection
    let geometry = fireballGeometry;
    let material = fireballMaterial;
    if (spell.type === 'ice_shard') { geometry = iceShardGeometry; material = iceShardMaterial; }
    if (spell.type === 'magic_missile') { geometry = magicMissileGeometry; material = magicMissileMaterial; }

    // Fallback for new spells if no asset yet
    const isStandardAsset = ['fireball', 'ice_shard', 'magic_missile'].includes(spell.type);

    return (
        <RigidBody
            ref={ref}
            position={spell.position}
            sensor={!isFireball}
            colliders="ball"
            restitution={restitution}
            friction={friction}
            onIntersectionEnter={!isFireball ? handleCollision : undefined}
            onCollisionEnter={isFireball ? handleCollision : undefined}
            gravityScale={gravity}
            name="spell"
            userData={useMemo(() => ({ tag: 'spell', type: spell.type }), [spell.type])}
            collisionGroups={interactionGroups(2, collisionMask)}
        >
            {isStandardAsset ? (
                <mesh geometry={geometry} material={material} />
            ) : (
                <mesh>
                    <sphereGeometry args={[0.3]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </mesh>
            )}
        </RigidBody>
    );
});

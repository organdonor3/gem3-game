import { useMemo } from 'react';
import * as THREE from 'three';
import type { StatusEffect } from './EnemyManager';

interface EnemyStatusResult {
    effectiveSpeed: number;
    movementOverride: THREE.Vector3 | null;
    isGrounded: boolean;
    canMove: boolean;
    colorOverlay: string | null;
}

export const useEnemyStatus = (
    currentPos: THREE.Vector3,
    statusEffects: StatusEffect[] | undefined,
    baseSpeed: number
): EnemyStatusResult => {
    return useMemo(() => {
        let speedMultiplier = 1;
        let movementOverride: THREE.Vector3 | null = null;
        let isGrounded = false;
        let canMove = true;
        let colorOverlay: string | null = null;

        if (!statusEffects || statusEffects.length === 0) {
            return { effectiveSpeed: baseSpeed, movementOverride: null, isGrounded: false, canMove: true, colorOverlay: null };
        }

        // 1. Process Status Effects
        for (const effect of statusEffects) {
            switch (effect.type) {
                case 'slow':
                    speedMultiplier -= (effect.intensity || 0.3);
                    break;
                case 'frozen':
                    canMove = false;
                    colorOverlay = '#00FFFF'; // Cyan
                    break;
                case 'grounded':
                    isGrounded = true;
                    break;
                case 'wet':
                    if (!colorOverlay) colorOverlay = '#0000FF'; // Blue (if not frozen)
                    break;
                case 'burning':
                    if (!colorOverlay) colorOverlay = '#FF4500'; // OrangeRed
                    break;
                case 'fear':
                    if (effect.source) {
                        const sourcePos = new THREE.Vector3(effect.source.x, effect.source.y, effect.source.z);
                        // Run AWAY: Vector from Source to Us
                        movementOverride = new THREE.Vector3().subVectors(currentPos, sourcePos).normalize();
                        speedMultiplier *= 1.5; // Run fast when scared
                        if (!colorOverlay) colorOverlay = '#800080'; // Purple
                    }
                    break;
                case 'lure':
                    if (effect.source) {
                        const sourcePos = new THREE.Vector3(effect.source.x, effect.source.y, effect.source.z);
                        // Run TOWARDS: Vector from Us to Source
                        movementOverride = new THREE.Vector3().subVectors(sourcePos, currentPos).normalize();
                        if (!colorOverlay) colorOverlay = '#FF69B4'; // Pink
                    }
                    break;
            }
        }

        // Clamp Speed
        speedMultiplier = Math.max(0.1, speedMultiplier);
        const effectiveSpeed = canMove ? baseSpeed * speedMultiplier : 0;

        return {
            effectiveSpeed,
            movementOverride,
            isGrounded,
            canMove,
            colorOverlay
        };
    }, [currentPos, statusEffects, baseSpeed]);
};

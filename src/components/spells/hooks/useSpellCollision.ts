import { useCallback } from 'react';
import { useGameStore } from '../../../stores/useGameStore';
import { SpellDefinitions } from '../SpellDefinitions';
import type { SpellType } from '../SpellDefinitions';
import * as THREE from 'three';

export const useSpellCollision = (spellType: SpellType, playerId: string, onRemove: () => void) => {
    const { friendlyFire } = useGameStore();
    const definition = SpellDefinitions[spellType];

    const handleCollision = useCallback((e: any) => {
        const other = e.other.rigidBodyObject;
        if (!other) return;

        const tag = other.userData?.tag;
        const isFireball = spellType === 'fireball';
        const isMagicMissile = spellType === 'magic_missile';

        // Damage Calculation
        const damage = isFireball ? 3 : (isMagicMissile ? 1.5 : 0.5);

        // 1. Handle Player Hit (Friendly Fire)
        if (tag === 'player') {
            if (friendlyFire) {
                let finalDamage = damage;
                const targetId = other.userData.id;

                // --- SYNERGY CHECK ---
                // We need to fetch the target's active effects.
                // Since we don't have direct access to other players' state here easily without passing it down,
                // we can try to look it up via Playroom or dispatch an event that the GameStore handles.
                // However, for immediate physics feedback, we might need a workaround.
                // Ideally, PlayerController should handle 'hit' events and calculate damage/synergies locally if it's the victim.
                // BUT, the shooter calculates the hit.

                // Solution: Dispatch 'player-hit' with spell tags, and let the victim (or host) calculate the synergy.
                // Actually, we can just send the tags and let the store handle it.

                window.dispatchEvent(new CustomEvent('player-hit', {
                    detail: {
                        playerId: targetId,
                        damage: finalDamage,
                        spellTags: definition.tags, // Pass tags for synergy
                        spellType: spellType
                    }
                }));

                // Special Case: Fireball triggers Wind Blast on player hit too?
                if (isFireball) {
                    window.dispatchEvent(new CustomEvent('cast-spell', {
                        detail: {
                            type: 'wind_blast',
                            position: e.target.translation(), // Approximation
                            direction: new THREE.Vector3(0, 1, 0),
                            playerId: playerId
                        }
                    }));
                }
                onRemove();
            }
            return;
        }

        // 2. Handle Enemy Hit
        if (tag === 'enemy') {
            // Deal Damage
            window.dispatchEvent(new CustomEvent('enemy-hit', {
                detail: { enemyId: other.name, damage: damage }
            }));

            // Apply Status Effects from Definition
            if (definition.componentType === 'projectile' && definition.effects) {
                definition.effects.forEach(effect => {
                    window.dispatchEvent(new CustomEvent('apply-effect', {
                        detail: {
                            enemyId: other.name,
                            effect: effect.type,
                            duration: effect.duration,
                            intensity: effect.intensity,
                            source: e.target.translation() // Source position for Fear/Lure
                        }
                    }));
                });
            }

            // Elemental Combos (Placeholder for now, logic can be expanded here)
            // Example: If target is Wet and spell is Lightning -> Chain Damage
            // This would require knowing the target's status, which we don't have here easily without a lookup.
            // For now, we rely on the events.

            // Special Case: Fireball triggers Wind Blast
            if (isFireball) {
                window.dispatchEvent(new CustomEvent('cast-spell', {
                    detail: {
                        type: 'wind_blast',
                        position: e.target.translation(),
                        direction: new THREE.Vector3(0, 1, 0),
                        playerId: playerId
                    }
                }));
            }

            onRemove();
        }
    }, [spellType, playerId, friendlyFire, onRemove, definition]);

    return { handleCollision, friendlyFire };
};

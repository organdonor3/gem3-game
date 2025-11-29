import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onPlayerJoin, myPlayer, useMultiplayerState } from 'playroomkit';
import * as THREE from 'three';
import { SpellDefinitions } from './SpellDefinitions';
import type { SpellType } from './SpellDefinitions';
import { SpellRegistry } from './SpellRegistry';
import { SpellAssetsProvider } from './SpellAssetsContext';
import { GlobalPrewarmer } from '../systems/GlobalPrewarmer';

interface SpellInstance {
    id: string;
    type: SpellType;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    createdAt: number;
    playerId: string;
}

// Helper component to track enemies without re-rendering SpellManager
const EnemyTracker = ({ enemiesRef }: { enemiesRef: React.MutableRefObject<any[]> }) => {
    const [enemies] = useMultiplayerState('enemies', []);
    useEffect(() => {
        enemiesRef.current = enemies;
    }, [enemies]);
    return null;
};

export const SpellManager = () => {
    const [spells, setSpells] = useState<SpellInstance[]>([]);
    const enemiesRef = useRef<any[]>([]);

    const addSpell = (data: any) => {
        performance.mark('spell-cast-start');
        const { type, position, direction, playerId } = data;
        const newSpell: SpellInstance = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            position: new THREE.Vector3(position.x, position.y, position.z),
            direction: new THREE.Vector3(direction.x, direction.y, direction.z),
            createdAt: Date.now(),
            playerId
        };

        setSpells(prev => {
            const next = [...prev, newSpell];
            // console.log(`[Perf] Active Spells: ${next.length}`);
            return next;
        });

        requestAnimationFrame(() => {
            performance.mark('spell-cast-end');
            performance.measure('Spell Cast Time', 'spell-cast-start', 'spell-cast-end');
        });
    };

    useEffect(() => {
        // Local Casts
        const handleCast = (e: any) => {
            addSpell(e.detail);
        };

        window.addEventListener('cast-spell', handleCast);
        return () => window.removeEventListener('cast-spell', handleCast);
    }, []);

    // Remote Casts
    useEffect(() => {
        const players: any[] = [];
        const quitListeners: (() => void)[] = [];

        const unsubscribe = onPlayerJoin((state) => {
            players.push(state);

            const unsubQuit = state.onQuit(() => {
                const idx = players.indexOf(state);
                if (idx !== -1) players.splice(idx, 1);
            });
            // Check if unsubQuit is a function before pushing (just in case)
            if (typeof unsubQuit === 'function') {
                quitListeners.push(unsubQuit);
            }
        });

        // Polling for new casts
        const interval = setInterval(() => {
            players.forEach(p => {
                if (p.id === myPlayer()?.id) return;

                const cast = p.getState('lastCast');
                const lastProcessed = (p as any)._lastCastTime || 0;

                if (cast && cast.timestamp > lastProcessed) {
                    (p as any)._lastCastTime = cast.timestamp;
                    addSpell(cast);
                }
            });
        }, 100);

        return () => {
            clearInterval(interval);
            unsubscribe();
            quitListeners.forEach(unsub => unsub());
        };
    }, []);

    const removeSpell = useCallback((id: string) => {
        setSpells(prev => prev.filter(s => s.id !== id));
    }, []);

    return (
        <SpellAssetsProvider>
            <GlobalPrewarmer />
            <group>
                <EnemyTracker enemiesRef={enemiesRef} />
                {spells.map(spell => (
                    <SpellController
                        key={spell.id}
                        spell={spell}
                        enemiesRef={enemiesRef}
                        removeSpell={removeSpell}
                    />
                ))}
            </group>
        </SpellAssetsProvider>
    );
};

// Memoized SpellController
const SpellController = React.memo(({ spell, enemiesRef, removeSpell }: { spell: SpellInstance, enemiesRef: React.MutableRefObject<any[]>, removeSpell: (id: string) => void }) => {
    const onRemove = useCallback(() => removeSpell(spell.id), [removeSpell, spell.id]);

    const definition = SpellDefinitions[spell.type];
    if (!definition) {
        console.warn(`Unknown spell type: ${spell.type}`);
        return null;
    }

    const SpellComponent = SpellRegistry[definition.componentType];

    return (
        <SpellComponent
            spell={spell}
            onRemove={onRemove}
            enemiesRef={enemiesRef}
        />
    );
});

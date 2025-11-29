export interface SynergyResult {
    name: string;
    damageMultiplier?: number;
    bonusDamage?: number;
    addedEffect?: { type: string; duration: number; intensity?: number };
    removeTriggerEffect?: boolean; // If true, removes the effect that triggered this (e.g. Melt removes Frozen)
    visualColor?: string;
}

export const SynergyMatrix: Record<string, Record<string, SynergyResult>> = {
    // Incoming Spell Tag -> { Active Effect Type -> Result }

    // FIRE Interactions
    'fire': {
        'frozen': {
            name: 'Melt',
            bonusDamage: 10,
            removeTriggerEffect: true,
            visualColor: '#00ffff' // Cyan steam
        },
        'wet': {
            name: 'Vaporize',
            bonusDamage: 5,
            removeTriggerEffect: true,
            visualColor: '#ffffff' // White steam
        },
        'oil': { // Future proofing
            name: 'Combustion',
            bonusDamage: 20,
            addedEffect: { type: 'burning', duration: 5000 },
            visualColor: '#ff4400'
        }
    },

    // ICE Interactions
    'ice': {
        'wet': {
            name: 'Deep Freeze',
            addedEffect: { type: 'frozen', duration: 4000 }, // Upgrade wet to frozen
            removeTriggerEffect: true,
            visualColor: '#00ffff'
        },
        'burning': {
            name: 'Melt',
            bonusDamage: 10,
            removeTriggerEffect: true,
            visualColor: '#00ffff'
        }
    },

    // ELECTRIC Interactions
    'electric': {
        'wet': {
            name: 'Electrocute',
            damageMultiplier: 2.0, // Double damage
            addedEffect: { type: 'stun', duration: 1000 },
            visualColor: '#ffff00'
        }
    },

    // WATER Interactions
    'water': {
        'burning': {
            name: 'Extinguish',
            removeTriggerEffect: true,
            visualColor: '#ffffff'
        }
    },

    // WIND Interactions
    'wind': {
        'burning': {
            name: 'Inferno', // Spread fire? For now just bonus damage
            bonusDamage: 5,
            addedEffect: { type: 'burning', duration: 2000 } // Refresh burn
        }
    }
};

export const checkSynergy = (spellTags: string[], activeEffects: { type: string }[]): SynergyResult | null => {
    for (const tag of spellTags) {
        if (SynergyMatrix[tag]) {
            for (const effect of activeEffects) {
                if (SynergyMatrix[tag][effect.type]) {
                    return SynergyMatrix[tag][effect.type];
                }
            }
        }
    }
    return null;
};

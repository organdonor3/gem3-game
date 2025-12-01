import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameConfig } from '../config';

interface GameState {
    // Game Status
    isPlaying: boolean;
    isPaused: boolean;
    score: number;
    highScore: number;

    // Settings
    volume: number;
    friendlyFire: boolean;

    // Player Stats
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;

    // Actions
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    endGame: () => void;
    addScore: (points: number) => void;
    setVolume: (vol: number) => void;
    toggleFriendlyFire: () => void;

    // Player Actions
    setHp: (hp: number) => void;
    setMana: (mana: number) => void;
    addMana: (amount: number) => void;
    damagePlayer: (amount: number) => void;
    consumeMana: (amount: number) => boolean;
    spellCooldown: number;
    setSpellCooldown: (val: number) => void;

    activeEffects: { type: string; duration: number; intensity?: number; startTime: number }[];
    addEffect: (effect: { type: string; duration: number; intensity?: number }) => void;
    removeEffect: (type: string) => void;
    tickEffects: (delta: number) => void;

    mySpells: { primary: string; secondary: string };
    setMySpells: (spells: Partial<{ primary: string; secondary: string }>) => void;

    isMotherShipActive: boolean;
    setMotherShipActive: (active: boolean) => void;

    // Game Modes
    gameMode: 'lobby' | 'parkour' | 'collector' | 'mining';
    setGameMode: (mode: 'lobby' | 'parkour' | 'collector' | 'mining') => void;

    // Scoring
    playerScores: Record<string, number>;
    addPlayerScore: (playerId: string, points: number) => void;
    resetScores: () => void;

    // Mining Mode State
    crystalFragments: number;
    addCrystalFragments: (amount: number) => void;
    spendCrystalFragments: (amount: number) => boolean;

    crystalHealth: number;
    maxCrystalHealth: number;
    damageCrystal: (amount: number) => void;
    resetCrystal: () => void;

    structures: { id: string; type: 'turret' | 'sweeper_house'; position: [number, number, number]; owner: string; level: number }[];
    addStructure: (structure: { type: 'turret' | 'sweeper_house'; position: [number, number, number]; owner: string }) => void;
    upgradeStructure: (id: string) => void;

    unlockedTech: string[];
    unlockTech: (tech: string) => void;

    // Spawn & Respawn
    spawnPoint: [number, number, number];
    setSpawnPoint: (point: [number, number, number]) => void;
    respawnTrigger: number;
    triggerRespawn: () => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            isPlaying: false,
            isPaused: false,
            score: 0,
            highScore: 0,
            volume: GameConfig.defaultVolume,
            friendlyFire: false,

            hp: 100,
            maxHp: 100,
            mana: 100,
            maxMana: 100,
            spellCooldown: 0,

            startGame: () => set({ isPlaying: true, isPaused: false, score: 0, hp: 100, mana: 100 }),
            pauseGame: () => set({ isPaused: true }),
            resumeGame: () => set({ isPaused: false }),
            endGame: () => {
                const { score, highScore } = get();
                set({
                    isPlaying: false,
                    highScore: Math.max(score, highScore)
                });
            },
            addScore: (points) => set((state) => ({ score: state.score + points })),
            setVolume: (vol) => {
                set({ volume: vol });
                import('../systems/AudioManager').then(({ audioManager }) => {
                    audioManager.setVolume(vol);
                });
            },
            toggleFriendlyFire: () => set((state) => ({ friendlyFire: !state.friendlyFire })),

            setHp: (hp) => set({ hp }),
            setMana: (mana) => set({ mana }),
            damagePlayer: (amount) => set((state) => {
                const newHp = Math.max(0, state.hp - amount);
                if (newHp === 0) {
                    // Game Over logic here? Or just let Player handle it?
                    // For now, just update HP.
                }
                return { hp: newHp };
            }),
            consumeMana: (amount) => {
                const { mana } = get();
                if (mana >= amount) {
                    set({ mana: mana - amount });
                    return true;
                }
                return false;
            },
            addMana: (amount) => set((state) => ({
                mana: Math.min(state.maxMana, state.mana + amount)
            })),
            setSpellCooldown: (val) => set({ spellCooldown: val }),

            // Status Effects
            activeEffects: [],
            addEffect: (effect) => set((state) => {
                const existing = state.activeEffects.find(e => e.type === effect.type);
                if (existing) {
                    // Refresh duration
                    return {
                        activeEffects: state.activeEffects.map(e =>
                            e.type === effect.type ? { ...e, duration: effect.duration } : e
                        )
                    };
                }
                return {
                    activeEffects: [...state.activeEffects, { ...effect, startTime: Date.now() }]
                };
            }),
            removeEffect: (type) => set((state) => ({
                activeEffects: state.activeEffects.filter(e => e.type !== type)
            })),
            tickEffects: (delta) => set((state) => {
                let hpChange = 0;

                const nextEffects = state.activeEffects.map(e => {
                    // DoT Logic
                    if (e.type === 'burning') {
                        hpChange -= 5 * delta; // 5 DPS
                    }
                    return { ...e, duration: e.duration - (delta * 1000) };
                }).filter(e => e.duration > 0);

                if (hpChange !== 0) {
                    // Apply HP change (avoid calling setHp to prevent recursion/overhead, just update state)
                    return {
                        activeEffects: nextEffects,
                        hp: Math.max(0, Math.min(state.maxHp, state.hp + hpChange))
                    };
                }

                return { activeEffects: nextEffects };
            }),

            // Local Player Spells (for HUD immediate update)
            mySpells: { primary: 'fireball', secondary: 'fireball' },
            setMySpells: (spells) => set((state) => ({ mySpells: { ...state.mySpells, ...spells } })),

            isMotherShipActive: false,
            setMotherShipActive: (active) => set({ isMotherShipActive: active }),

            gameMode: 'lobby',
            setGameMode: (mode) => set({ gameMode: mode }),

            playerScores: {},
            addPlayerScore: (playerId, points) => set((state) => ({
                playerScores: {
                    ...state.playerScores,
                    [playerId]: (state.playerScores[playerId] || 0) + points
                }
            })),
            resetScores: () => set({ playerScores: {} }),

            spawnPoint: [0, 5, 0],
            setSpawnPoint: (point) => set({ spawnPoint: point }),
            respawnTrigger: 0,
            triggerRespawn: () => set((state) => ({ respawnTrigger: state.respawnTrigger + 1, hp: state.maxHp })),

            // Mining Mode Implementation
            crystalFragments: 0,
            addCrystalFragments: (amount) => set((state) => ({ crystalFragments: state.crystalFragments + amount })),
            spendCrystalFragments: (amount) => {
                const { crystalFragments } = get();
                if (crystalFragments >= amount) {
                    set({ crystalFragments: crystalFragments - amount });
                    return true;
                }
                return false;
            },

            crystalHealth: 1000,
            maxCrystalHealth: 1000,
            damageCrystal: (amount) => set((state) => ({ crystalHealth: Math.max(0, state.crystalHealth - amount) })),
            resetCrystal: () => set({ crystalHealth: 1000, structures: [], unlockedTech: ['turret'] }),

            structures: [],
            addStructure: (structure) => set((state) => ({
                structures: [...state.structures, { ...structure, id: Math.random().toString(36).substr(2, 9), level: 1 }]
            })),
            upgradeStructure: (id) => set((state) => ({
                structures: state.structures.map(s => s.id === id ? { ...s, level: s.level + 1 } : s)
            })),

            unlockedTech: ['turret'],
            unlockTech: (tech) => set((state) => ({ unlockedTech: [...state.unlockedTech, tech] }))
        }),
        {
            name: 'game-storage', // unique name
            partialize: (state) => ({ highScore: state.highScore, volume: state.volume }), // Only persist these
            onRehydrateStorage: () => (state) => {
                if (state) {
                    import('../systems/AudioManager').then(({ audioManager }) => {
                        audioManager.setVolume(state.volume);
                    });
                }
            }
        }
    )
);

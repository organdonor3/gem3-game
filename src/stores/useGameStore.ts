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

    // Player Actions
    setHp: (hp: number) => void;
    setMana: (mana: number) => void;
    damagePlayer: (amount: number) => void;
    consumeMana: (amount: number) => boolean;
    spellCooldown: number;
    setSpellCooldown: (val: number) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            isPlaying: false,
            isPaused: false,
            score: 0,
            highScore: 0,
            volume: GameConfig.defaultVolume,

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
            setSpellCooldown: (val) => set({ spellCooldown: val })
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

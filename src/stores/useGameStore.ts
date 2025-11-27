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

    // Actions
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    endGame: () => void;
    addScore: (points: number) => void;
    setVolume: (vol: number) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            isPlaying: false,
            isPaused: false,
            score: 0,
            highScore: 0,
            volume: GameConfig.defaultVolume,

            startGame: () => set({ isPlaying: true, isPaused: false, score: 0 }),
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

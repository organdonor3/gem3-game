import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { TouchControls } from './TouchControls';

export const HUD: React.FC = () => {
    const { score, isPaused, pauseGame, resumeGame } = useGameStore();

    if (isPaused) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
                <div className="bg-gray-800 p-8 rounded-xl text-center pointer-events-auto">
                    <h2 className="text-3xl text-white font-bold mb-4">PAUSED</h2>
                    <button
                        onClick={resumeGame}
                        className="px-6 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-bold"
                    >
                        RESUME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-30 p-4">
            <div className="flex justify-between items-start">
                <div className="bg-black/50 p-4 rounded-lg text-white">
                    <div className="text-sm text-gray-400">SCORE</div>
                    <div className="text-3xl font-bold font-mono">{score.toString().padStart(6, '0')}</div>
                </div>

                <button
                    onClick={pauseGame}
                    className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {/* Mobile Controls Hint */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 text-sm hidden md:block">
                WASD to Move • SPACE to Jump
            </div>

            {/* Touch Controls (only visible on touch devices) */}
            <div className="pointer-events-auto">
                <TouchControls />
            </div>
        </div>
    );
};

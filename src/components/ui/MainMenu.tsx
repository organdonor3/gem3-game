import React from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const MainMenu: React.FC = () => {
    const { startGame, highScore } = useGameStore();

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50">
            <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                GAME TEMPLATE
            </h1>

            <div className="flex flex-col gap-4 w-64">
                <button
                    onClick={startGame}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                    PLAY GAME
                </button>

                <button
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
                    onClick={() => alert("Multiplayer Lobby - Coming Soon")}
                >
                    MULTIPLAYER
                </button>

                <button
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
                    onClick={() => alert("Settings - Coming Soon")}
                >
                    SETTINGS
                </button>
            </div>

            <div className="mt-8 text-gray-400">
                High Score: <span className="text-yellow-400">{highScore}</span>
            </div>
        </div>
    );
};

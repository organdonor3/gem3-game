import { useGameStore } from '../../stores/useGameStore';
import { isHost, onPlayerJoin } from 'playroomkit';
import type { PlayerState } from 'playroomkit';
import { useState, useEffect } from 'react';
import { PageTransition } from './PageTransition';
import { SettingsMenu } from './SettingsMenu';
import { InstallPrompt } from './InstallPrompt';

export const MainMenu = () => {
    const startGame = useGameStore((state) => state.startGame);
    const [players, setPlayers] = useState<PlayerState[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        onPlayerJoin((state) => {
            setPlayers((p) => {
                if (p.find(player => player.id === state.id)) return p;
                return [...p, state];
            });

            state.onQuit(() => {
                setPlayers((p) => p.filter((player) => player.id !== state.id));
            });
        });
    }, []);

    const handleStart = async () => {
        startGame();
    };

    if (showSettings) {
        return <SettingsMenu onBack={() => setShowSettings(false)} />;
    }

    return (
        <PageTransition className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
            <InstallPrompt />
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-8 drop-shadow-lg">
                GEM HUNTER
            </h1>

            <div className="bg-gray-900/80 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl max-w-md w-full">
                <div className="mb-6">
                    <h2 className="text-xl text-gray-400 mb-2">Lobby</h2>
                    <div className="flex gap-2 flex-wrap">
                        {players.map((p) => (
                            <div key={p.id} className="w-10 h-10 rounded-full border-2 border-white" style={{ backgroundColor: p.getProfile().color.hex as unknown as string }} />
                        ))}
                        {players.length === 0 && <div className="text-gray-500 italic">Waiting for players...</div>}
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleStart}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        START GAME
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                    >
                        SETTINGS
                    </button>
                </div>

                <div className="mt-4 text-center text-gray-500 text-sm">
                    {isHost() ? "You are the Host" : "Waiting for Host to start"}
                </div>
            </div>
        </PageTransition>
    );
};

import { useState, useEffect } from 'react';
import { onPlayerJoin, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';

export const PlayerListHUD = () => {
    const [players, setPlayers] = useState<PlayerState[]>([]);

    useEffect(() => {
        // Add self first
        setPlayers([myPlayer()]);

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

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 p-2 rounded-2xl backdrop-blur-sm">
            {players.map((player) => {
                const profile = player.getProfile();
                const color = (profile?.color?.hex || '#ffffff') as string;
                const photo = profile?.photo || '';
                const name = profile?.name || 'Unknown';

                return (
                    <div
                        key={player.id}
                        className="flex flex-col items-center gap-1 min-w-[80px]"
                    >
                        <div
                            className="w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden bg-white/10"
                            style={{ borderColor: color }}
                        >
                            {photo && (
                                <img
                                    src={photo}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <span
                            className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: color }}
                        >
                            {name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

import { useState, useEffect } from 'react';
import { onPlayerJoin, myPlayer } from 'playroomkit';
import type { PlayerState } from 'playroomkit';

const PlayerBadge = ({ player }: { player: PlayerState }) => {
    const [profile, setProfile] = useState(player.getProfile());
    const [isHostUser, setIsHostUser] = useState(false);

    useEffect(() => {
        // Initial check
        setIsHostUser(player.getState('isHost'));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const newProfile = player.getProfile();
            setProfile((prev) => {
                // Force update if we have a name now and didn't before
                if (!prev?.name && newProfile?.name) return newProfile;
                // Standard change check
                if (prev?.name !== newProfile?.name || prev?.photo !== newProfile?.photo) {
                    return newProfile;
                }
                return prev;
            });

            // Check Host Status
            setIsHostUser(player.getState('isHost'));
        }, 1000);
        return () => clearInterval(interval);
    }, [player]);

    // Generate a consistent color from ID if profile color is missing/white
    const getColorFromId = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    const profileColor = profile?.color?.hex as unknown as string | undefined;
    const color = ((profileColor && profileColor !== '#ffffff') ? profileColor : getColorFromId(player.id)) as string;

    const photo = profile?.photo || '';
    // Fallback to ID if name is missing
    const name = profile?.name || `Player ${player.id.substr(0, 4)}`;

    return (
        <div className="flex flex-col items-center gap-1 min-w-[80px] relative">
            <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden bg-white/10 relative"
                style={{ borderColor: color }}
            >
                {photo ? (
                    <img
                        src={photo}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
                )}

                {/* Host Crown Icon */}
                {isHostUser && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow-sm">
                        👑
                    </div>
                )}
            </div>

            <span
                className="text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-black/20"
                style={{ backgroundColor: color, textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
            >
                {name}
            </span>
        </div>
    );
};

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
            {players.map((player) => (
                <PlayerBadge key={player.id} player={player} />
            ))}
        </div>
    );
};

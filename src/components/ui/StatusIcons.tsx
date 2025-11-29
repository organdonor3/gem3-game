import { Html } from '@react-three/drei';
import type { StatusEffect } from '../enemies/EnemyManager';

export const StatusIcons = ({ effects }: { effects?: StatusEffect[] }) => {
    if (!effects || effects.length === 0) return null;

    // Deduplicate types for icons (don't show 5 fire icons)
    const uniqueTypes = Array.from(new Set(effects.map(e => e.type)));

    return (
        <Html position={[0, 2, 0]} center distanceFactor={10}>
            <div style={{ display: 'flex', gap: '4px', pointerEvents: 'none' }}>
                {uniqueTypes.map(type => (
                    <div key={type} style={{
                        fontSize: '24px',
                        filter: 'drop-shadow(0 0 2px black)',
                        animation: 'bounce 1s infinite'
                    }}>
                        {getIconForEffect(type)}
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </Html>
    );
};

const getIconForEffect = (type: string) => {
    switch (type) {
        case 'slow': return '🐌';
        case 'fear': return '😱';
        case 'lure': return '🍖';
        case 'grounded': return '⚓';
        case 'wet': return '💧';
        case 'burning': return '🔥';
        case 'frozen': return '❄️';
        default: return '❓';
    }
};

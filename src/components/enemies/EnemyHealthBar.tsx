import { Html } from '@react-three/drei';

interface EnemyHealthBarProps {
    hp: number;
    maxHp: number;
}

export const EnemyHealthBar = ({ hp, maxHp }: EnemyHealthBarProps) => {
    if (hp >= maxHp) return null; // Hide if full health

    return (
        <Html position={[0, 1.5, 0]} center distanceFactor={10}>
            <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-black">
                <div
                    className="h-full bg-red-500 transition-all duration-200"
                    style={{ width: `${(hp / maxHp) * 100}%` }}
                />
            </div>
        </Html>
    );
};

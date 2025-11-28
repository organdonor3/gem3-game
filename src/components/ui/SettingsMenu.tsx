import { useGameStore } from '../../stores/useGameStore';
import { PageTransition } from './PageTransition';

interface SettingsMenuProps {
    onBack: () => void;
}

export const SettingsMenu = ({ onBack }: SettingsMenuProps) => {
    const { volume, setVolume } = useGameStore();

    return (
        <PageTransition className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
            <div className="bg-gray-900 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">SETTINGS</h2>

                <div className="space-y-6">
                    {/* Volume Control */}
                    <div>
                        <label className="block text-gray-400 mb-2">Master Volume: {Math.round(volume * 100)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    {/* Graphics Toggle (Placeholder for now) */}
                    <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                        <span className="text-gray-300">High Quality Graphics</span>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input type="checkbox" className="peer absolute w-12 h-6 opacity-0 cursor-pointer" defaultChecked />
                            <label className="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-cyan-500 transition-colors duration-200"></label>
                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-6"></span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="mt-8 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                >
                    BACK
                </button>
            </div>
        </PageTransition>
    );
};

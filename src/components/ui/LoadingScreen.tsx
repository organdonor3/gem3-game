import { useProgress } from '@react-three/drei';
import { PageTransition } from './PageTransition';

export const LoadingScreen = () => {
    const { progress } = useProgress();

    return (
        <PageTransition className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
            <div className="w-64">
                <h2 className="text-2xl font-bold text-white mb-4 text-center animate-pulse">
                    LOADING...
                </h2>

                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-white/20">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-gray-500 text-center mt-2 text-sm">
                    {Math.round(progress)}%
                </p>
            </div>
        </PageTransition>
    );
};

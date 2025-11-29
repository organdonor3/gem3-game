import { useProgress, Html } from '@react-three/drei';
import { useEffect, useState } from 'react';

interface AssetLoaderProps {
    onLoaded: () => void;
}

export const AssetLoader = ({ onLoaded }: AssetLoaderProps) => {
    const { progress, active, total } = useProgress();
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        const loadAudio = async () => {
            // Audio Disabled for Debugging (Context Loss Fix)
            /*
            console.log("Starting audio load...");
            const audioUrls = Object.values(Assets.Audio);
            await Promise.all(audioUrls.map(preloadAudio));
            console.log("Audio load complete.");
            */
            setAudioLoaded(true);
        };
        loadAudio();
    }, []);

    useEffect(() => {
        console.log(`Loader State - Progress: ${progress}, Active: ${active}, Total: ${total}, AudioLoaded: ${audioLoaded}`);

        // If no 3D assets (total === 0) or progress is 100, AND audio is done
        if ((progress === 100 || total === 0) && audioLoaded) {
            console.log("All assets loaded, triggering onLoaded...");
            const timer = setTimeout(onLoaded, 500);
            return () => clearTimeout(timer);
        }
    }, [progress, active, total, audioLoaded, onLoaded]);

    return (
        <Html center>
            <div className="text-white font-mono text-sm bg-black/50 p-2 rounded">
                Loading Assets...<br />
                Audio: {audioLoaded ? "Done" : "Loading"}<br />
                3D: {Math.round(progress)}% ({total} items)
            </div>
        </Html>
    );
};

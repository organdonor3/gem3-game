import { useState, useEffect } from 'react';
import { PageTransition } from './PageTransition';

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <PageTransition className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="bg-gray-900/90 border border-cyan-500/30 backdrop-blur-md p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-white font-bold">Install App</h3>
                    <p className="text-gray-400 text-xs">Add to Home Screen for best experience</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="px-3 py-2 text-gray-400 hover:text-white text-sm"
                    >
                        Later
                    </button>
                    <button
                        onClick={handleInstall}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-lg"
                    >
                        Install
                    </button>
                </div>
            </div>
        </PageTransition>
    );
};

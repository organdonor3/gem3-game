import { useEffect, useRef } from "react";

export const useTractorBeam = (id: string) => {
    const isInBeam = useRef(false);

    useEffect(() => {
        const handleTractorBeam = (e: any) => {
            if (e.detail.targetId === id) {
                isInBeam.current = e.detail.active;
            }
        };

        window.addEventListener('tractor-beam', handleTractorBeam);
        return () => {
            window.removeEventListener('tractor-beam', handleTractorBeam);
        };
    }, [id]);

    return isInBeam;
};

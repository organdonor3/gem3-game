import { create } from 'zustand';

interface InputState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    fire: boolean;
    altFire: boolean;

    setForward: (active: boolean) => void;
    setBackward: (active: boolean) => void;
    setLeft: (active: boolean) => void;
    setRight: (active: boolean) => void;
    setJump: (active: boolean) => void;
    setFire: (active: boolean) => void;
    setAltFire: (active: boolean) => void;
}

export const useInputStore = create<InputState>((set) => {
    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.code) {
            case 'KeyW': set({ forward: true }); break;
            case 'KeyS': set({ backward: true }); break;
            case 'KeyA': set({ left: true }); break;
            case 'KeyD': set({ right: true }); break;
            case 'Space': set({ jump: true }); break;
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.code) {
            case 'KeyW': set({ forward: false }); break;
            case 'KeyS': set({ backward: false }); break;
            case 'KeyA': set({ left: false }); break;
            case 'KeyD': set({ right: false }); break;
            case 'Space': set({ jump: false }); break;
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) set({ fire: true });
        if (e.button === 2) set({ altFire: true });
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 0) set({ fire: false });
        if (e.button === 2) set({ altFire: false });
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault(); // Prevent context menu on right click
    };

    // Add event listeners
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);
    }

    return {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        fire: false,
        altFire: false,

        setForward: (active) => set({ forward: active }),
        setBackward: (active) => set({ backward: active }),
        setLeft: (active) => set({ left: active }),
        setRight: (active) => set({ right: active }),
        setJump: (active) => set({ jump: active }),
        setFire: (active) => set({ fire: active }),
        setAltFire: (active) => set({ altFire: active }),
    };
});

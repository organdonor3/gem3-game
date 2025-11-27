import { create } from 'zustand';

interface InputState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;

    setForward: (active: boolean) => void;
    setBackward: (active: boolean) => void;
    setLeft: (active: boolean) => void;
    setRight: (active: boolean) => void;
    setJump: (active: boolean) => void;
}

export const useInputStore = create<InputState>((set) => ({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,

    setForward: (active) => set({ forward: active }),
    setBackward: (active) => set({ backward: active }),
    setLeft: (active) => set({ left: active }),
    setRight: (active) => set({ right: active }),
    setJump: (active) => set({ jump: active }),
}));

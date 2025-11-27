import { useEffect } from 'react';
import { useInputStore } from '../stores/useInputStore';

export const useKeyboardControls = () => {
    const { setForward, setBackward, setLeft, setRight, setJump } = useInputStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setForward(true);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    setBackward(true);
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    setLeft(true);
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    setRight(true);
                    break;
                case 'Space':
                    setJump(true);
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setForward(false);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    setBackward(false);
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    setLeft(false);
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    setRight(false);
                    break;
                case 'Space':
                    setJump(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
};

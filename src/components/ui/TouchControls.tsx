import { Joystick } from 'react-joystick-component';
import { useInputStore } from '../../stores/useInputStore';
import { useState, useEffect } from 'react';

export const TouchControls = () => {
    const { setForward, setBackward, setLeft, setRight, setJump } = useInputStore();
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        const checkTouch = () => {
            setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkTouch();
        window.addEventListener('resize', checkTouch);
        return () => window.removeEventListener('resize', checkTouch);
    }, []);

    if (!isTouch) return null;

    const handleMove = (event: any) => {
        if (!event) {
            setForward(false);
            setBackward(false);
            setLeft(false);
            setRight(false);
            return;
        }

        const { y, x } = event;
        setForward(y > 0.5);
        setBackward(y < -0.5);
        setRight(x > 0.5);
        setLeft(x < -0.5);
    };

    const handleStop = () => {
        setForward(false);
        setBackward(false);
        setLeft(false);
        setRight(false);
    };

    return (
        <div className="absolute bottom-10 left-10 z-50 flex gap-10 items-end">
            <Joystick
                size={100}
                baseColor="rgba(255, 255, 255, 0.2)"
                stickColor="rgba(255, 255, 255, 0.5)"
                move={handleMove}
                stop={handleStop}
            />

            <button
                className="w-20 h-20 rounded-full bg-white/20 active:bg-white/50 backdrop-blur-sm border-2 border-white/30 absolute bottom-0 right-[-200px]"
                onTouchStart={() => setJump(true)}
                onTouchEnd={() => setJump(false)}
                onMouseDown={() => setJump(true)}
                onMouseUp={() => setJump(false)}
            >
                JUMP
            </button>
        </div>
    );
};

import { useState, useEffect } from "react";
import { usePlayersList, myPlayer } from "playroomkit";

export const NetworkDebug = () => {
    const players = usePlayersList(true); // true = include self? No, usually just list.
    // usePlayersList might not trigger updates on state changes, so we might need a manual listener or just poll.

    // Better approach for debug: Poll every 500ms
    const [debugData, setDebugData] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const data = players.map(p => ({
                id: p.id,
                isMe: p.id === myPlayer().id,
                pos: p.getState("pos"),
                init: p.getState("initialized"),
                color: p.getProfile()?.color?.hex
            }));
            setDebugData(data);
        }, 500);
        return () => clearInterval(interval);
    }, [players]);

    return (
        <div style={{
            position: 'absolute',
            top: '100px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 9999
        }}>
            <h3>Network Debug</h3>
            {debugData.map(d => (
                <div key={d.id} style={{ marginBottom: '10px', borderBottom: '1px solid #444' }}>
                    <div>ID: {d.id} {d.isMe ? '(ME)' : ''}</div>
                    <div>Init: {d.init ? 'YES' : 'NO'}</div>
                    <div>Pos: {d.pos ? `${d.pos.x.toFixed(2)}, ${d.pos.y.toFixed(2)}, ${d.pos.z.toFixed(2)}` : 'NULL'}</div>
                    <div>Color: {d.color || 'N/A'}</div>
                </div>
            ))}
        </div>
    );
};

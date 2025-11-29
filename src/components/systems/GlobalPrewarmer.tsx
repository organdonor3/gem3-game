import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Define Geometries and Materials Globally
const magicMissileGeometry = new THREE.OctahedronGeometry(0.2, 0);
const magicMissileMaterial = new THREE.MeshStandardMaterial({ color: "purple", emissive: "purple", emissiveIntensity: 4, toneMapped: false });

const fireballGeometry = new THREE.SphereGeometry(0.4);
const fireballMaterial = new THREE.MeshStandardMaterial({ color: "orange", emissive: "orange", emissiveIntensity: 2 });

const iceShardGeometry = new THREE.SphereGeometry(0.2);
const iceShardMaterial = new THREE.MeshStandardMaterial({ color: "cyan", emissive: "cyan", emissiveIntensity: 2 });

const lightningSegmentGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
const lightningSegmentMaterial = new THREE.MeshBasicMaterial({ color: "yellow", toneMapped: false });

// Export them so SpellManager can use them too (avoiding duplication)
export const SpellAssets = {
    magicMissile: { geometry: magicMissileGeometry, material: magicMissileMaterial },
    fireball: { geometry: fireballGeometry, material: fireballMaterial },
    iceShard: { geometry: iceShardGeometry, material: iceShardMaterial },
    lightning: { geometry: lightningSegmentGeometry, material: lightningSegmentMaterial }
};

export const GlobalPrewarmer = () => {
    const [mounted, setMounted] = useState(true);

    useEffect(() => {
        console.log("[GlobalPrewarmer] Initializing assets...");

        // Keep them mounted for a few frames to ensure GPU upload
        const timer = setTimeout(() => {
            console.log("[GlobalPrewarmer] Assets prewarmed. Hiding prewarmer.");
            setMounted(false);
        }, 500); // 500ms should be plenty

        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <group position={[0, -1000, 0]}> {/* Far away */}
            <mesh geometry={magicMissileGeometry} material={magicMissileMaterial} />
            <mesh geometry={fireballGeometry} material={fireballMaterial} />
            <mesh geometry={iceShardGeometry} material={iceShardMaterial} />
            <mesh geometry={lightningSegmentGeometry} material={lightningSegmentMaterial} />
        </group>
    );
};

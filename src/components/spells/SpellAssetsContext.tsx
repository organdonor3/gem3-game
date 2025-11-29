import React, { createContext, useContext } from 'react';
import { SpellAssets } from '../systems/GlobalPrewarmer';
import * as THREE from 'three';

interface SpellAssetsContextType {
    magicMissileGeometry: THREE.BufferGeometry;
    magicMissileMaterial: THREE.Material;
    fireballGeometry: THREE.BufferGeometry;
    fireballMaterial: THREE.Material;
    iceShardGeometry: THREE.BufferGeometry;
    iceShardMaterial: THREE.Material;
    lightningSegmentGeometry: THREE.BufferGeometry;
    lightningSegmentMaterial: THREE.Material;
}

const SpellAssetsContext = createContext<SpellAssetsContextType | null>(null);

export const SpellAssetsProvider = ({ children }: { children: React.ReactNode }) => {
    // Extract from GlobalPrewarmer
    const { magicMissile, fireball, iceShard, lightning } = SpellAssets;

    const value: SpellAssetsContextType = {
        magicMissileGeometry: magicMissile.geometry,
        magicMissileMaterial: magicMissile.material,
        fireballGeometry: fireball.geometry,
        fireballMaterial: fireball.material,
        iceShardGeometry: iceShard.geometry,
        iceShardMaterial: iceShard.material,
        lightningSegmentGeometry: lightning.geometry,
        lightningSegmentMaterial: lightning.material,
    };

    return (
        <SpellAssetsContext.Provider value={value}>
            {children}
        </SpellAssetsContext.Provider>
    );
};

export const useSpellAssets = () => {
    const context = useContext(SpellAssetsContext);
    if (!context) {
        throw new Error('useSpellAssets must be used within a SpellAssetsProvider');
    }
    return context;
};

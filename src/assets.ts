// Centralized Asset Manifest
// AI Agents: Add new assets here to make them available in the game.

export const Assets = {
    models: {
        // player: '/assets/models/player.glb', // Example
    },
    textures: {
        // floor: '/assets/textures/floor.jpg', // Example
    },
    Audio: {
        bgm: './audio/bgm.mp3',
        jump: './audio/jump.mp3',
        collect: './audio/collect.mp3',
        click: './audio/click.mp3',
    },
};

export type AssetType = typeof Assets;

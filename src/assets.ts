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
        bgm: `${import.meta.env.BASE_URL}audio/bgm.mp3`,
        jump: `${import.meta.env.BASE_URL}audio/jump.mp3`,
        collect: `${import.meta.env.BASE_URL}audio/collect.mp3`,
        click: `${import.meta.env.BASE_URL}audio/click.mp3`,
    },
};

export type AssetType = typeof Assets;

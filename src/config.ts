export const GameConfig = {
    // World
    gravity: [0, -20, 0] as [number, number, number],

    // Player
    playerSpeed: 8,
    playerJumpForce: 1,
    playerRadius: 0.5,
    jetpackForce: 25,

    // Camera
    cameraFov: 75,
    cameraPosition: [0, 5, 10] as [number, number, number],

    // Audio
    defaultVolume: 0.5,

    // Multiplayer
    serverUrl: "http://localhost:3000",

    // Debug
    debugPhysics: false,
};

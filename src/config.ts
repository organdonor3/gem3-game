export const GameConfig = {
    // World
    gravity: [0, -9.81, 0] as [number, number, number],

    // Player
    playerSpeed: 5,
    playerJumpForce: 5,
    playerRadius: 0.5,

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

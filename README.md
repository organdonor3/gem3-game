# Game Template (React + Three.js)

## Overview
This is a high-performance, AI-friendly game template built with:
- **React** (UI & Component Structure)
- **React Three Fiber** (3D Rendering)
- **Rapier** (Physics)
- **Zustand** (State Management)
- **TailwindCSS** (Styling)

## Architecture for AI Agents

### 1. Configuration (`src/config.ts`)
**ALWAYS** check this file first. It contains global balance constants like speed, gravity, and damage.
- Modify `GameConfig` to rebalance the game without touching logic code.

### 2. Assets (`src/assets.ts`)
**ALWAYS** use this manifest to reference assets.
- Do NOT hardcode paths like `"/models/player.glb"`.
- Add new assets to `Assets` object in `src/assets.ts` first.

### 3. State (`src/stores/useGameStore.ts`)
Global game state (Score, Health, Settings) lives here.
- Use `useGameStore()` hook to access or modify state from ANY component.
- State is automatically persisted to `localStorage`.

### 4. Components
- **`src/scenes/GameScene.tsx`**: The main 3D world. Contains Lights, Physics World, and Level geometry.
- **`src/components/game/`**: 3D Game Objects (Player, Enemies).
- **`src/components/ui/`**: 2D HTML Overlays (Menu, HUD).

### 5. Physics
We use `@react-three/rapier`.
- **RigidBody**: Wraps any mesh that needs physics.
- **Sensors**: Use `sensor` prop on RigidBody for triggers (collectibles).

## Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run test`: Run unit tests.
- `node src/server/index.js`: Run local multiplayer server.

## Multiplayer
A basic socket.io setup is included.
- Client: `socket.io-client` (Ready to use in hooks).
- Server: `src/server/index.js` (Simple relay server).

# Game Template Setup

- [x] Initialize Project
    - [x] Create Vite + React + TS project
    - [x] Install dependencies (Three, R3F, Drei, Rapier, Zustand, Tailwind, Router)
    - [x] Configure Tailwind and TypeScript
- [x] Core Architecture
    - [x] Set up folder structure
    - [x] Create Game State Store (Zustand + Persist)
    - [x] Create Input Manager/Hooks (Keyboard + Touch)
    - [x] Setup Audio System (Howler + Manager)
    - [x] Setup Multiplayer Structure (Lobby Store, Connection Hooks, Local Server)
    - [x] Create Asset Manifest System
    - [x] Create Game Config System
    - [x] Configure PWA (manifest.json, service worker)
    - [x] Setup Vitest for Unit Testing
- [x] UI Systems
    - [x] Design Main Menu (with Multiplayer option)
    - [x] Create Lobby Interface (Room Code, Player List)
    - [x] Create HUD Overlay
    - [x] Create Pause/Settings Menu (Audio Controls, Persistence)
    - [x] Create Loading Screen (Suspense Integration)
    - [x] Create Error Boundary Component
    - [x] Implement Scene Transitions/Routing
- [x] Game Demo Implementation
    - [x] Create 3D Scene (Lights, Environment, Post-Processing)
    - [x] Implement Player Controller (Physics-based)
    - [x] Add Interactive Objects (Collectibles/Obstacles)
    - [x] Connect Game Logic to UI (Score, Health)
    - [x] Implement Physics Debug Toggle
    - [x] Implement Mobile Touch Controls (Joystick)
- [x] Verification
    - [x] Verify Build
    - [x] Verify Unit Tests (npm run test)
    - [x] Verify Controls and UI flow
    - [x] Verify Multiplayer Connection (Local)
    - [x] Verify Persistence (Reload page)
    - [x] Verify PWA Installation
- [x] Documentation & Deployment
    - [x] Create README.md with Architecture Overview
    - [x] Create GitHub Actions Workflow (Deploy to Pages)

# Phase 2: Improvements
- [x] Switch Multiplayer to Playroom Kit
    - [x] Uninstall Socket.io / Delete Server
# Game Template Setup

- [x] Initialize Project
    - [x] Create Vite + React + TS project
    - [x] Install dependencies (Three, R3F, Drei, Rapier, Zustand, Tailwind, Router)
    - [x] Configure Tailwind and TypeScript
- [x] Core Architecture
    - [x] Set up folder structure
    - [x] Create Game State Store (Zustand + Persist)
    - [x] Create Input Manager/Hooks (Keyboard + Touch)
    - [x] Setup Audio System (Howler + Manager)
    - [x] Setup Multiplayer Structure (Lobby Store, Connection Hooks, Local Server)
    - [x] Create Asset Manifest System
    - [x] Create Game Config System
    - [x] Configure PWA (manifest.json, service worker)
    - [x] Setup Vitest for Unit Testing
- [x] UI Systems
    - [x] Design Main Menu (with Multiplayer option)
    - [x] Create Lobby Interface (Room Code, Player List)
    - [x] Create HUD Overlay
    - [x] Create Pause/Settings Menu (Audio Controls, Persistence)
    - [x] Create Loading Screen (Suspense Integration)
    - [x] Create Error Boundary Component
    - [x] Implement Scene Transitions/Routing
- [x] Game Demo Implementation
    - [x] Create 3D Scene (Lights, Environment, Post-Processing)
    - [x] Implement Player Controller (Physics-based)
    - [x] Add Interactive Objects (Collectibles/Obstacles)
    - [x] Connect Game Logic to UI (Score, Health)
    - [x] Implement Physics Debug Toggle
    - [x] Implement Mobile Touch Controls (Joystick)
- [x] Verification
    - [x] Verify Build
    - [x] Verify Unit Tests (npm run test)
    - [x] Verify Controls and UI flow
    - [x] Verify Multiplayer Connection (Local)
    - [x] Verify Persistence (Reload page)
    - [x] Verify PWA Installation
- [x] Documentation & Deployment
    - [x] Create README.md with Architecture Overview
    - [x] Create GitHub Actions Workflow (Deploy to Pages)

# Phase 2: Improvements
- [x] Switch Multiplayer to Playroom Kit
    - [x] Uninstall Socket.io / Delete Server
    - [x] Install `playroomkit`
    - [x] Initialize `insertCoin()` in `main.tsx`
    - [x] Implement `NetworkPlayer` component
- [x] Implement Mobile Touch Controls
- [x] Implement Audio System
- [x] Implement Gameplay Loop (Coins/Score)
- [x] Implement Game Feel (Camera Shake, Squash & Stretch)

# Phase 3: Polish & Infrastructure
- [ ] UI/UX Polish
    - [x] Install `framer-motion`
    - [x] Create `PageTransition` component
    - [x] Implement Settings Menu (Volume, Graphics)
    - [x] Improve Loading Screen
- [ ] PWA & Mobile Experience
    - [x] Add Install Prompt UI
    - [x] Fix Viewport/Touch behaviors
- [ ] Developer Experience
    - [x] Create Debug Panel (Leva/Stats)
    - [x] Configure Path Aliases
- [x] Code Quality
    - [x] Audit Strict Mode compliance

# Phase 4: Architecture & Infrastructure
- [x] Architecture & Code Quality
    - [x] Strict Typing (Remove `any`)
    - [x] Create Barrel Exports (`index.ts`)
    - [ ] Centralize Theme/Config
- [x] Game Infrastructure
    - [x] Implement Asset Preloader (Audio/Textures)
    - [x] Create Global Error Boundary

# Phase 5: Gameplay Polish
- [x] Camera System
    - [x] Implement `CameraController` (OrbitControls with Right-Click)
    - [x] Smooth Camera Follow
- [x] Netcode
    - [x] Implement Position Interpolation (Smoothing)

# Phase 6: Visual Polish & Mechanics
- [x] Player Model
    - [x] Create `PlayerModel` component (Robot/Character)
    - [x] Add "Juice" (Tilt, Bobbing, Particles/Trail)
    - [x] Integrate into `Player` and `NetworkPlayers`
- [x] Mechanics
    - [x] Implement Jetpack (Hold Space)
    - [x] Tune Jump Height

# Phase 7: Hub World & UI Integration
- [x] Game Flow
    - [x] Skip Main Menu (Auto-start game)
    - [x] Rename `GameScene` to `HubWorld` (conceptual, maybe just keep name)
- [x] Player Identity
    - [x] Sync Player Color from Playroom to `PlayerModel`
- [x] HUD
    - [x] Create `PlayerListHUD` component
    - [x] Display Name, Icon, Color for all players
- [x] HUD
    - [x] Create `PlayerListHUD` component
    - [x] Display Name, Icon, Color for all players
    - [x] Position at bottom of screen

# Phase 8: Polish & Optimization
- [x] Movement Smoothing
    - [x] Fix local player jitter (Camera/Physics sync)
    - [x] Tune Physics Interpolation

# Phase 9: Physics Playground (Open World)
- [x] Mechanics
    - [x] Implement "Grab & Throw" (Left Click)
- [x] Interactive Objects
    - [x] `MovableBox` (Standard weight)
    - [x] `BouncyBall` (High restitution)
    - [x] `ExplosiveBarrel` (Skipped for now)
    - [x] `Spinner` (Motorized platform)
    - [x] `Trampoline` (Vertical boost)
    - [x] `BreakableCrate` (Destructible)
    - [x] `ConveyorBelt` (Moving surface)
- [x] Level Design
    - [x] Open Hub Layout (Scatter objects)
    - [x] Physics Puzzles (Seesaw, Stacking)

# Phase 10: Robot Spellcaster
- [x] Core Systems
    - [x] Remove "Grab & Throw"
    - [x] Implement Spell System (Cast logic, Cooldowns)
    - [x] Create `SpellTome` (Pickup)
- [x] Spells (10 Types)
    - [x] Fireball (Explosive Projectile)
    - [x] Lightning (Instant Hit)
    - [x] Ice Shard (Slow)
    - [x] Wind Blast (Knockback)
    - [x] Magic Missile (Homing)
    - [x] Earth Wall (Blocker)
    - [x] Heal (Recovery)
    - [x] Blink (Teleport)
    - [x] Black Hole (Gravity)
    - [x] Laser Beam (Continuous)
- [x] Enemies
    - [x] `EnemySpawner` (Trigger-based)

# Phase 11: Spell Polish & Juice
- [x] Mechanics
    - [x] Decouple Aiming (Use Character Forward instead of Camera)
- [x] Spell Enhancements
    - [x] **Fireball**: Add Bounciness (Restitution)
    - [x] **Lightning**: Jagged/Electric Visuals
    - [x] **General**: Add particle effects/trails (if feasible quickly)

# Phase 12: Enemy Juice & Expansion
- [x] Enemy Enhancements
    - [x] **BlobEnemy**: Add Squash & Stretch / Wobble Animation
    - [x] **FlyingEnemy**: Add Banking/Hover Animation & Engine Glow
    - [x] **EnemySpawner**: Add Pulsing/Portal Visuals
- [x] New Enemies
    - [x] **TankEnemy**: Slow, High HP, Large
    - [x] **SpeedyEnemy**: Fast, Low HP, Small
- [x] Level Design
    - [x] Add multiple Spawners to `GameScene`
    - [x] Vary Spawner types (Blob, Flying, Tank, Speedy)

# Phase 13: Health & Mana Systems
- [x] Player Stats
    - [x] Add HP & Mana State (with Regen)
    - [x] Update HUD with Health/Mana Bars
- [x] Enemy Stats
    - [x] Add HP State to Enemies
    - [x] Add Floating Health Bars to Enemies
- [x] Combat Logic
    - [x] Implement Spell Damage (Collision Detection)
    - [x] Enemy Death Logic (Particles/Despawn)

# Phase 14: Networking & Synchronization
- [ ] Player Visibility (CRITICAL)
    - [ ] Verify `NetworkPlayers` component usage
    - [ ] Debug Player State Sync (Position/Rotation)
- [ ] Enemy Synchronization
    - [ ] Host-Authoritative Spawning (Only Host spawns)
    - [ ] Sync Enemy Positions & States (RPC or Shared State)
- [ ] Spell Synchronization
    - [ ] Broadcast Spell Casting Events
    - [ ] Sync Spell Impacts/Damage

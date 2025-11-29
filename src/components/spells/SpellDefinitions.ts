export type SpellType =
    | 'fireball'
    | 'lightning'
    | 'ice_shard'
    | 'wind_blast'
    | 'magic_missile'
    | 'earth_wall'
    | 'heal'
    | 'blink'
    | 'black_hole'
    | 'laser_beam'
    | 'water_gun'
    | 'bait_ball'
    | 'summon_cage'
    | 'net_projectile'
    | 'shout';

export type SpellComponentType = 'projectile' | 'instant' | 'area' | 'wall' | 'effect';

export interface SpellEffect {
    type: 'slow' | 'fear' | 'lure' | 'grounded' | 'wet' | 'burning' | 'frozen';
    duration: number;
    intensity?: number;
}

export interface CastBehavior {
    count?: number;             // Projectiles per shot (default: 1)
    spread?: number;            // Spread angle in degrees (default: 0)
    spreadType?: 'random' | 'linear'; // 'random' = cone error, 'linear' = fixed arc (default: 'random')
    burstCount?: number;        // Number of sequential shots (default: 1)
    burstDelay?: number;        // Delay between burst shots in ms (default: 0)
    startOffset?: number;       // Forward offset for spawn (default: 1.5)
    manaCost?: number;          // Cost per activation (default: 10)
    cooldown?: number;          // Cooldown in seconds (default: 0.5)
}

export interface BaseSpellConfig {
    type: SpellType;
    componentType: SpellComponentType;
    tags: string[];
    effects?: SpellEffect[];
    color: string; // Visual color for UI/Hands
    castBehavior?: CastBehavior; // Data-driven casting logic
}

export interface ProjectileSpellConfig extends BaseSpellConfig {
    componentType: 'projectile';
    speed: number;
    gravity?: number;
}

export interface InstantSpellConfig extends BaseSpellConfig {
    componentType: 'instant';
}

export interface AreaSpellConfig extends BaseSpellConfig {
    componentType: 'area';
    radius?: number;
}

export interface WallSpellConfig extends BaseSpellConfig {
    componentType: 'wall';
    wallType: 'wall' | 'cage'; // Subtype for wall logic
}

export interface EffectSpellConfig extends BaseSpellConfig {
    componentType: 'effect';
    subType: 'heal' | 'blink';
}

export type SpellDefinition =
    | ProjectileSpellConfig
    | InstantSpellConfig
    | AreaSpellConfig
    | WallSpellConfig
    | EffectSpellConfig;

export const SpellDefinitions: Record<SpellType, SpellDefinition> = {
    fireball: {
        type: 'fireball',
        componentType: 'projectile',
        speed: 20,
        color: 'orange',
        tags: ['fire'],
        effects: [{ type: 'burning', duration: 3000 }]
    },
    ice_shard: {
        type: 'ice_shard',
        componentType: 'projectile',
        speed: 30,
        color: 'cyan',
        tags: ['ice'],
        effects: [{ type: 'slow', duration: 3000, intensity: 0.3 }]
    },
    magic_missile: {
        type: 'magic_missile',
        componentType: 'projectile',
        speed: 15,
        color: 'purple',
        tags: ['arcane']
    },
    water_gun: {
        type: 'water_gun',
        componentType: 'projectile',
        speed: 25,
        color: 'blue',
        tags: ['water'],
        effects: [{ type: 'wet', duration: 5000 }, { type: 'fear', duration: 1000 }]
    },
    bait_ball: {
        type: 'bait_ball',
        componentType: 'projectile',
        speed: 15,
        color: 'pink',
        tags: ['physical'],
        effects: [{ type: 'lure', duration: 5000 }]
    },
    net_projectile: {
        type: 'net_projectile',
        componentType: 'projectile',
        speed: 15,
        gravity: 1,
        color: 'green',
        tags: ['physical'],
        effects: [{ type: 'grounded', duration: 5000 }]
    },
    lightning: {
        type: 'lightning',
        componentType: 'instant',
        color: 'yellow',
        tags: ['electric']
    },
    laser_beam: {
        type: 'laser_beam',
        componentType: 'instant',
        color: 'red',
        tags: ['tech']
    },
    wind_blast: {
        type: 'wind_blast',
        componentType: 'area',
        color: 'white',
        tags: ['wind']
    },
    black_hole: {
        type: 'black_hole',
        componentType: 'area',
        color: 'black',
        tags: ['gravity']
    },
    shout: {
        type: 'shout',
        componentType: 'area',
        color: 'gold',
        tags: ['sound']
    },
    earth_wall: {
        type: 'earth_wall',
        componentType: 'wall',
        wallType: 'wall',
        color: 'brown',
        tags: ['earth']
    },
    summon_cage: {
        type: 'summon_cage',
        componentType: 'wall',
        wallType: 'cage',
        color: 'silver',
        tags: ['physical']
    },
    heal: {
        type: 'heal',
        componentType: 'effect',
        subType: 'heal',
        color: 'green',
        tags: ['holy']
    },
    blink: {
        type: 'blink',
        componentType: 'effect',
        subType: 'blink',
        color: 'magenta',
        tags: ['arcane']
    },
};

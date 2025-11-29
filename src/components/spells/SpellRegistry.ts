import { ProjectileSpell } from './types/ProjectileSpell';
import { InstantSpell } from './types/InstantSpell';
import { AreaSpell } from './types/AreaSpell';
import { WallSpell } from './types/WallSpell';
import { EffectSpell } from './types/EffectSpell';
import type { SpellComponentType } from './SpellDefinitions';

export const SpellRegistry: Record<SpellComponentType, React.ComponentType<any>> = {
    projectile: ProjectileSpell,
    instant: InstantSpell,
    area: AreaSpell,
    wall: WallSpell,
    effect: EffectSpell,
};

import { z } from 'zod';

const enabledFlagSchema = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');

const serverFeatureEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ENABLE_PAYMENT_SIMULATION: enabledFlagSchema,
  ENABLE_LEGACY_PAIRING: enabledFlagSchema,
  ENABLE_THINKING_GAMES_PILOT: enabledFlagSchema,
  ENABLE_THINKING_GAMES_BONUS: enabledFlagSchema,
  ENABLE_THINKING_GAMES_SERVE_PILOT_CONTENT: enabledFlagSchema,
  ENABLE_THINKING_GAMES_INTERNAL_CATALOG: enabledFlagSchema,
  ENABLE_THINKING_GAMES: enabledFlagSchema,
});

export type ServerFeatures = Readonly<{
  paymentSimulationEnabled: boolean;
  legacyPairingEnabled: boolean;
  thinkingGamesPilotEnabled: boolean;
  thinkingGamesBonusEnabled: boolean;
  thinkingGamesServePilotContentEnabled: boolean;
  thinkingGamesInternalCatalogEnabled: boolean;
  thinkingGamesReleaseEnabled: boolean;
}>;

export function getServerFeatures(environment: NodeJS.ProcessEnv = process.env): ServerFeatures {
  const parsed = serverFeatureEnvironmentSchema.parse(environment);
  const unsafeDevelopmentFeaturesAllowed = parsed.NODE_ENV !== 'production';

  const pilotEnabled = unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_PILOT;
  const bonusEnabled = unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_BONUS && pilotEnabled;

  return {
    paymentSimulationEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_PAYMENT_SIMULATION,
    legacyPairingEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_LEGACY_PAIRING,
    thinkingGamesPilotEnabled: pilotEnabled,
    thinkingGamesBonusEnabled: bonusEnabled,
    thinkingGamesServePilotContentEnabled:
      unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_SERVE_PILOT_CONTENT,
    thinkingGamesInternalCatalogEnabled:
      unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_INTERNAL_CATALOG,
    thinkingGamesReleaseEnabled: parsed.ENABLE_THINKING_GAMES,
  };
}

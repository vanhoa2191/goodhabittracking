import { z } from 'zod';

const enabledFlagSchema = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');

const serverFeatureEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ENABLE_PAYMENT_SIMULATION: enabledFlagSchema,
  ENABLE_LEGACY_PAIRING: enabledFlagSchema,
});

export type ServerFeatures = Readonly<{
  paymentSimulationEnabled: boolean;
  legacyPairingEnabled: boolean;
}>;

export function getServerFeatures(environment: NodeJS.ProcessEnv = process.env): ServerFeatures {
  const parsed = serverFeatureEnvironmentSchema.parse(environment);
  const unsafeDevelopmentFeaturesAllowed = parsed.NODE_ENV !== 'production';

  return {
    paymentSimulationEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_PAYMENT_SIMULATION,
    legacyPairingEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_LEGACY_PAIRING,
  };
}

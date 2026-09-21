import { describe, expect, it } from 'vitest';

import { getServerFeatures } from '@/lib/server-features';

describe('getServerFeatures', () => {
  it('Given no opt-in flags When features resolve Then unsafe routes are disabled', () => {
    const features = getServerFeatures({ NODE_ENV: 'development' });

    expect(features).toEqual({
      paymentSimulationEnabled: false,
      legacyPairingEnabled: false,
    });
  });

  it('Given production opt-in flags When features resolve Then unsafe routes remain disabled', () => {
    const features = getServerFeatures({
      NODE_ENV: 'production',
      ENABLE_PAYMENT_SIMULATION: 'true',
      ENABLE_LEGACY_PAIRING: 'true',
    });

    expect(features).toEqual({
      paymentSimulationEnabled: false,
      legacyPairingEnabled: false,
    });
  });

  it('Given development opt-in flags When features resolve Then local testing is enabled', () => {
    const features = getServerFeatures({
      NODE_ENV: 'development',
      ENABLE_PAYMENT_SIMULATION: 'true',
      ENABLE_LEGACY_PAIRING: 'true',
    });

    expect(features).toEqual({
      paymentSimulationEnabled: true,
      legacyPairingEnabled: true,
    });
  });
});

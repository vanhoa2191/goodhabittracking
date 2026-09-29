const serverOnlyNames = [
  'PAYOS_CLIENT_ID',
  'PAYOS_API_KEY',
  'PAYOS_CHECKSUM_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAIRING_RATE_LIMIT_SECRET',
];

const backendBrowserNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function prepareCloudflareBuildEnvironment(environment, mode) {
  const buildEnvironment = { ...environment };
  const target = environment.NEXT_PUBLIC_DEPLOY_TARGET?.trim() || 'combined';

  for (const name of serverOnlyNames) delete buildEnvironment[name];

  if (target === 'marketing') {
    for (const name of backendBrowserNames) delete buildEnvironment[name];
  }

  if (mode === 'deploy' || environment.NODE_ENV === 'production') {
    if (!['combined', 'marketing', 'app'].includes(target)) {
      throw new Error('Cloudflare build blocked: NEXT_PUBLIC_DEPLOY_TARGET must be combined, marketing, or app.');
    }

    const requiredBrowserNames = [
      'NEXT_PUBLIC_APP_URL',
      ...(target === 'combined' ? [] : ['NEXT_PUBLIC_MARKETING_URL']),
      ...(target === 'marketing' ? [] : backendBrowserNames),
    ];
    const missingNames = requiredBrowserNames.filter(
      (name) => !buildEnvironment[name]?.trim(),
    );
    if (missingNames.length > 0) {
      throw new Error(
        `Cloudflare deploy blocked: browser configuration is missing (${missingNames.join(', ')}).`,
      );
    }

    for (const name of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_MARKETING_URL']) {
      const value = buildEnvironment[name]?.trim();
      if (!value) continue;
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error(`Cloudflare build blocked: ${name} must be an HTTPS origin.`);
      }
      if (url.protocol !== 'https:' || url.username || url.password ||
          url.pathname !== '/' || url.search || url.hash) {
        throw new Error(`Cloudflare build blocked: ${name} must be an HTTPS origin without credentials, path, query, or fragment.`);
      }
    }
  }

  return buildEnvironment;
}

export { serverOnlyNames };

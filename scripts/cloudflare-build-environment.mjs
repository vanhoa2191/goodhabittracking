const serverOnlyNames = [
  'PAYOS_CLIENT_ID',
  'PAYOS_API_KEY',
  'PAYOS_CHECKSUM_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAIRING_RATE_LIMIT_SECRET',
];

const requiredBrowserNames = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function prepareCloudflareBuildEnvironment(environment, mode) {
  const buildEnvironment = { ...environment };

  for (const name of serverOnlyNames) delete buildEnvironment[name];

  if (mode === 'deploy') {
    const missingNames = requiredBrowserNames.filter(
      (name) => !buildEnvironment[name]?.trim(),
    );
    if (missingNames.length > 0) {
      throw new Error(
        `Cloudflare deploy blocked: browser configuration is missing (${missingNames.join(', ')}).`,
      );
    }
  }

  return buildEnvironment;
}

export { serverOnlyNames };

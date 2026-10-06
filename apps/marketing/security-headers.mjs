import { createHash } from 'node:crypto';

// Static pages carry one small inline script (the signed-in hint). It is allowed by hash,
// so any other inline script a future page or injected markup adds is refused by the browser.
export function inlineScriptHashes(documents) {
  const hashes = new Set();
  for (const html of documents) {
    for (const match of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
    }
  }
  return [...hashes].sort();
}

/**
 * @param {string[]} documents every rendered page, for the inline script hashes
 * @param {{ appOrigin?: string }} [options] the app origin the pages may read from (the live launch offer count)
 */
export function renderHeadersFile(documents, { appOrigin } = {}) {
  const scriptSources = ["'self'", ...inlineScriptHashes(documents)].join(' ');
  const policy = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data: https:",
    appOrigin ? `connect-src ${appOrigin}` : "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
  return [
    '/*',
    '  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    `  Content-Security-Policy: ${policy}`,
    '',
    '/*.html',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
  ].join('\n');
}

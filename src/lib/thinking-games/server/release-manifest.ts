/**
 * Trusted production-release manifest identity and pinned digest.
 *
 * RELEASE_MANIFEST_VERSION — filename (sans .json) of the on-disk release manifest
 *   the serving catalog is permitted to load.
 *
 * RELEASE_MANIFEST_DIGEST — SHA-256 of the human-approved release manifest file
 *   bytes.  Empty string signals "no human-approved manifest has been pinned yet";
 *   the catalog fails closed (catalog_not_approved) until an operator populates
 *   this constant with the real digest after editorial sign-off.
 *
 * This constant is intentionally never set to true blindly.  Both the flag
 * (ENABLE_THINKING_GAMES) and a non-empty digest that matches the on-disk file
 * are required before the release profile is admitted.
 */
export const RELEASE_MANIFEST_VERSION = 'release-365-v3';

export const RELEASE_MANIFEST_DIGEST = '2fb5fbf2d5a3079aa3fa031a481fb836e47ca0bb1cc4f0a800c3d97465067ea3';

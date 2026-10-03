export const PARENT_SECTIONS = ['approvals', 'habits', 'journeys', 'rewards', 'children', 'analytics', 'settings'] as const;
export type ParentSection = (typeof PARENT_SECTIONS)[number];

export const DEFAULT_PARENT_SECTION: ParentSection = 'approvals';

export const SETTINGS_SECTIONS = [
  { id: 'settings-devices', nav: 'navDevices' },
  { id: 'settings-account', nav: 'navAccount' },
  { id: 'settings-privacy', nav: 'navPrivacy' },
  { id: 'settings-appearance', nav: 'navAppearance' },
  { id: 'settings-security', nav: 'navSecurity' },
  { id: 'settings-offers', nav: 'navOffers' },
] as const;
export type SettingsAnchor = (typeof SETTINGS_SECTIONS)[number]['id'];

const SECTION_PARAM = 'section';

export type ParentLocation = Readonly<{ pathname: string; search: string; hash: string }>;

function isParentSection(value: string | null): value is ParentSection {
  return PARENT_SECTIONS.some((section) => section === value);
}

/** The settings anchor named by a URL hash, or null for any other hash. */
export function parseSettingsAnchor(hash: string): SettingsAnchor | null {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  return SETTINGS_SECTIONS.find((section) => section.id === id)?.id ?? null;
}

/**
 * The parent section a URL asks for. Unknown values are ignored, and a settings anchor on its own opens Settings.
 * The URL only picks a tab inside the parent area; whether that area is shown stays with the parent unlock.
 */
export function parseParentSection(search: string, hash: string): ParentSection {
  const requested = new URLSearchParams(search).get(SECTION_PARAM);
  if (isParentSection(requested)) return requested;
  return parseSettingsAnchor(hash) ? 'settings' : DEFAULT_PARENT_SECTION;
}

/** The URL for a section, keeping other parameters. The default section leaves no parameter, and a settings anchor only stays on Settings. */
export function buildParentSectionUrl(location: ParentLocation, section: ParentSection): string {
  const params = new URLSearchParams(location.search);
  if (section === DEFAULT_PARENT_SECTION) params.delete(SECTION_PARAM);
  else params.set(SECTION_PARAM, section);
  const query = params.toString();
  const hash = section !== 'settings' && parseSettingsAnchor(location.hash) ? '' : location.hash;
  return `${location.pathname}${query ? `?${query}` : ''}${hash}`;
}

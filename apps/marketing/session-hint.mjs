// Shared by the app (which sets it) and the marketing site (which reads it).
// The cookie only says "a parent is signed in on this browser". It carries no identity,
// token or family data; the real session stays on the app origin.
export const sessionHintCookie = 'kh_member';
export const sessionHintMaxAgeSeconds = 7 * 24 * 60 * 60;

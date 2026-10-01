import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AUTH_EMAIL_TEMPLATES } from '../src/lib/email/auth-templates.ts';

// Regenerates supabase/email-templates/*.html. A unit test fails when the committed files drift from this source.
const directory = resolve('supabase/email-templates');
mkdirSync(directory, { recursive: true });
for (const template of AUTH_EMAIL_TEMPLATES) {
  writeFileSync(resolve(directory, template.file), template.html);
}
process.stdout.write(`Wrote ${AUTH_EMAIL_TEMPLATES.length} email templates to supabase/email-templates.\n`);

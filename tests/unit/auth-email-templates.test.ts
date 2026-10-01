import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTH_EMAIL_TEMPLATES } from '@/lib/email/auth-templates';

const byFile = (file: string) => {
  const found = AUTH_EMAIL_TEMPLATES.find((template) => template.file === file);
  if (!found) throw new Error(`missing template ${file}`);
  return found;
};

describe('Supabase auth email templates', () => {
  it('matches the committed HTML, so dashboard copies are never stale', () => {
    for (const template of AUTH_EMAIL_TEMPLATES) {
      const committed = readFileSync(resolve('supabase/email-templates', template.file), 'utf8');
      expect(committed, `${template.file} is stale: run node scripts/build-email-templates.mjs`).toBe(template.html);
    }
  });

  it('puts only the one-time code in login, signup and reauthentication mail', () => {
    for (const file of ['magic-link.html', 'confirm-signup.html', 'reauthentication.html']) {
      const html = byFile(file).html;
      expect(html).toContain('{{ .Token }}');
      expect(html).not.toContain('{{ .ConfirmationURL }}');
    }
  });

  it('gives link-based mail a button and a pasteable fallback', () => {
    for (const file of ['invite.html', 'recovery.html', 'email-change.html']) {
      const html = byFile(file).html;
      expect(html.match(/\{\{ \.ConfirmationURL \}\}/g)?.length).toBe(2);
      expect(html).not.toContain('{{ .Token }}');
    }
    expect(byFile('email-change.html').html).toContain('{{ .NewEmail }}');
  });

  it('is safe for mail clients: no scripts, remote images, or tracking', () => {
    for (const template of AUTH_EMAIL_TEMPLATES) {
      expect(template.html).not.toMatch(/<script|<img|<link|<iframe|url\(|src=/i);
      expect(template.html).not.toMatch(/https?:\/\//i);
      expect(template.html).toContain('lang="vi"');
      expect(template.subject.length).toBeGreaterThan(0);
    }
  });

  it('only uses placeholders Supabase defines', () => {
    for (const template of AUTH_EMAIL_TEMPLATES) {
      for (const placeholder of template.html.match(/\{\{[^}]*\}\}/g) ?? []) {
        expect(['{{ .Token }}', '{{ .ConfirmationURL }}', '{{ .NewEmail }}']).toContain(placeholder);
      }
    }
  });
});

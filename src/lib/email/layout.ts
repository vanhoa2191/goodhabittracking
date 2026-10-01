// Shared HTML shell for every email KidHabit Hero sends (Supabase Auth templates and lifecycle mail).
// Email clients ignore most modern CSS and block remote images, so the layout is table-based with inline
// styles and carries the brand through colour and type only.

export const EMAIL_COLORS = {
  page: '#fbf8f3',
  card: '#ffffff',
  ink: '#1b1815',
  muted: '#6b645c',
  line: '#e7e0d6',
  primary: '#4f46e5',
  reward: '#fbbf24',
  rewardSoft: '#fffbeb',
} as const;

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_COLORS.ink}">${html}</p>`;
}

export function emailMutedNote(html: string): string {
  return `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.muted}">${html}</p>`;
}

// `href` is trusted markup supplied by the caller: a fixed URL or a Supabase placeholder such as {{ .ConfirmationURL }}.
export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px"><tr><td style="border-radius:12px;background:${EMAIL_COLORS.primary}"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a></td></tr></table>`;
}

// `code` is trusted markup: a Supabase placeholder such as {{ .Token }}.
export function emailCodeBox(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px"><tr><td align="center" style="padding:20px;background:${EMAIL_COLORS.rewardSoft};border:2px dashed ${EMAIL_COLORS.reward};border-radius:16px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:${EMAIL_COLORS.ink}">${code}</td></tr></table>`;
}

export function renderEmailShell(input: {
  readonly lang: 'vi' | 'en';
  readonly title: string;
  readonly preheader: string;
  readonly bodyHtml: string;
  readonly footerNote: string;
}): string {
  const { lang, title, preheader, bodyHtml, footerNote } = input;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_COLORS.page};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${EMAIL_COLORS.page}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px">
<tr><td style="padding:0 4px 16px;font-family:${FONT};font-size:20px;font-weight:800;color:${EMAIL_COLORS.primary}">&#9733; KidHabit Hero</td></tr>
<tr><td style="background:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.line};border-top:6px solid ${EMAIL_COLORS.primary};border-radius:16px;padding:32px 28px;font-family:${FONT}">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${EMAIL_COLORS.ink}">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${EMAIL_COLORS.muted}">${footerNote}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
}

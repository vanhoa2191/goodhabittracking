import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appUrl, escapeHtml, icon, renderDocument, renderInfoHero, slugify } from './render-site.mjs';

// Posts are Markdown files in apps/marketing/blog/<slug>.md with a small header (see docs/blog-guide.md).
// Everything the build reads is validated here, so a bad post fails the build instead of reaching the site.

const mascots = new Set(['leo', 'bunny', 'panda', 'fox', 'turtle', 'bee']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publisher = 'KidHabit Hero';

export class BlogError extends Error {}

function parseValue(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((item) => item.trim().replace(/^(["'])(.*)\1$/, '$2')).filter(Boolean);
  }
  const quoted = value.match(/^(["'])(.*)\1$/);
  return quoted ? quoted[2] : value;
}

export function parsePost(source, fileName) {
  const slug = fileName.replace(/\.md$/, '');
  if (!slugPattern.test(slug)) throw new BlogError(`${fileName}: the file name must be a lowercase slug such as "thoi-quen-nho.md".`);
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new BlogError(`${fileName}: the post must start with a --- header.`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator < 1) throw new BlogError(`${fileName}: cannot read the header line "${line}".`);
    meta[line.slice(0, separator).trim()] = parseValue(line.slice(separator + 1));
  }
  for (const key of ['title', 'description', 'date']) {
    if (typeof meta[key] !== 'string' || !meta[key]) throw new BlogError(`${fileName}: "${key}" is required.`);
  }
  const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (!isDate(meta.date)) throw new BlogError(`${fileName}: "date" must be YYYY-MM-DD.`);
  if (meta.updated !== undefined && (!isDate(meta.updated) || meta.updated < meta.date)) throw new BlogError(`${fileName}: "updated" must be YYYY-MM-DD and not before "date".`);
  if (meta.description.length > 200) throw new BlogError(`${fileName}: "description" is longer than 200 characters.`);
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  for (const tag of tags) if (!slugPattern.test(tag)) throw new BlogError(`${fileName}: tag "${tag}" must be a lowercase slug.`);
  const mascot = meta.mascot ?? 'leo';
  if (!mascots.has(mascot)) throw new BlogError(`${fileName}: mascot "${mascot}" is not one of ${[...mascots].join(', ')}.`);
  const body = match[2].trim();
  if (!body) throw new BlogError(`${fileName}: the post has no text.`);
  const words = body.split(/\s+/).length;
  return {
    slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    updated: meta.updated ?? meta.date,
    author: typeof meta.author === 'string' && meta.author ? meta.author : 'Đội ngũ KidHabit',
    tags,
    mascot,
    draft: meta.draft === true,
    body,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  };
}

export async function loadPosts(directory) {
  let names;
  try {
    names = (await readdir(directory)).filter((name) => name.endsWith('.md'));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const posts = [];
  for (const name of names.sort()) posts.push(parsePost(await readFile(join(directory, name), 'utf8'), name));
  return posts
    .filter((post) => !post.draft)
    .sort((first, second) => second.date.localeCompare(first.date) || first.title.localeCompare(second.title, 'vi'));
}

// ---- Markdown: headings, paragraphs, lists, quotes, rules, bold, italic, code and links. Text is always escaped first.

function safeUrl(url) {
  const value = url.trim();
  return /^(https:\/\/|\/|#|mailto:)/.test(value) ? value : null;
}

export function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, alt, url) => {
    const source = safeUrl(url);
    return source && !source.startsWith('#') && !source.startsWith('mailto:') ? `<img src="${source}" alt="${alt}" loading="lazy" decoding="async">` : alt;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, url) => {
    const target = safeUrl(url);
    if (!target) return label;
    const external = target.startsWith('https://');
    return `<a href="${target}"${external ? ' rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return html;
}

export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const headings = [];
  const used = new Map();
  let index = 0;
  const idFor = (text) => {
    const base = slugify(text) || 'muc';
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    const heading = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = idFor(text);
      headings.push({ level, id, text });
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^#\s/.test(line)) throw new BlogError('Use ## for headings inside a post: the title is already the page heading.');
    if (/^-{3,}\s*$/.test(line)) { html.push('<hr>'); index += 1; continue; }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) { quote.push(lines[index].replace(/^>\s?/, '')); index += 1; }
      html.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`);
      continue;
    }
    const listStart = line.match(/^(?:([-*])|(\d+)\.)\s+(.*)$/);
    if (listStart) {
      const ordered = Boolean(listStart[2]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/);
        if (!item) break;
        items.push(`<li>${renderInline(item[1])}</li>`);
        index += 1;
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|>|-{3,}\s*$|[-*]\s|\d+\.\s)/.test(lines[index])) { paragraph.push(lines[index].trim()); index += 1; }
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }
  return { html: html.join('\n'), headings };
}

// ---- Pages

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatDate = (date) => dateFormatter.format(new Date(`${date}T00:00:00Z`));

function jsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;
}

const feedLink = '<link rel="alternate" type="application/rss+xml" title="Blog KidHabit Hero" href="/blog/feed.xml">';

export function tagLabel(tag) {
  const known = { 'thoi-quen': 'Thói quen', 'khoa-hoc': 'Khoa học', 'phu-huynh': 'Ba mẹ đồng hành', 'khen-thuong': 'Khen thưởng', 'giac-ngu': 'Giấc ngủ', 'tai-chinh': 'Tiền bạc' };
  return known[tag] ?? tag.replaceAll('-', ' ');
}

function renderPostCard(post, { featured = false } = {}) {
  return `<li class="blog-card${featured ? ' blog-card-featured' : ''}">
    <a class="blog-card-link" href="/blog/${post.slug}/">
      <img class="blog-card-art" src="/mascots/${post.mascot}.webp" alt="" width="160" height="160" loading="lazy" decoding="async">
      <div class="blog-card-body">
        <p class="blog-meta"><time datetime="${post.date}">${formatDate(post.date)}</time><span aria-hidden="true">·</span><span>${post.readingMinutes} phút đọc</span></p>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.description)}</p>
        <span class="text-link">Đọc bài viết ${icon('arrow')}</span>
      </div>
    </a>
    ${post.tags.length ? `<ul class="blog-tags" aria-label="Chủ đề">${post.tags.map((tag) => `<li><a href="/blog/tag/${tag}/">${escapeHtml(tagLabel(tag))}</a></li>`).join('')}</ul>` : ''}
  </li>`;
}

function renderTagStrip(posts, activeTag) {
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => tagLabel(a).localeCompare(tagLabel(b), 'vi'));
  if (tags.length === 0) return '';
  return `<nav class="blog-topics" aria-label="Lọc theo chủ đề"><a href="/blog/"${activeTag ? '' : ' aria-current="page"'}>Tất cả</a>${tags.map((tag) => `<a href="/blog/tag/${tag}/"${tag === activeTag ? ' aria-current="page"' : ''}>${escapeHtml(tagLabel(tag))}</a>`).join('')}</nav>`;
}

export function renderBlogIndex({ posts, marketingOrigin, appOrigin, tag = null, allPosts = posts }) {
  const path = tag ? `/blog/tag/${tag}/` : '/blog/';
  const title = tag ? `Bài viết về ${tagLabel(tag)}` : 'Blog: đồng hành cùng con xây thói quen';
  const description = tag
    ? `Các bài viết của KidHabit Hero về ${tagLabel(tag).toLowerCase()}: gợi ý nhỏ, dễ làm cho ba mẹ.`
    : 'Bài viết ngắn, dễ áp dụng cho ba mẹ về thói quen của trẻ, cách đồng hành và những điều nghiên cứu cho biết.';
  const list = posts.length
    ? `<ul class="blog-list">${posts.map((post, position) => renderPostCard(post, { featured: !tag && position === 0 && posts.length > 2 })).join('')}</ul>`
    : '<div class="callout"><span class="icon-box">' + icon('book') + '</span><p>Những bài viết đầu tiên sắp ra mắt. Trong lúc chờ, ba mẹ có thể xem <a href="/framework/">khung thói quen</a> và <a href="/science/">cơ sở khoa học</a> của KidHabit.</p></div>';
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'blog', eyebrow: 'Blog', title: tag ? title : 'Góc nhỏ cho ba mẹ đồng hành cùng con', lede: tag ? description : 'Bài viết ngắn về thói quen của trẻ, viết đơn giản và luôn nói rõ điều nghiên cứu đã biết và chưa biết.', mascot: 'fox' })}
  <section class="section info-body"><div class="shell">${renderTagStrip(allPosts, tag)}${list}</div></section></main>`;
  const structuredData = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog KidHabit Hero',
    description,
    url: new URL(path, `${marketingOrigin}/`).href,
    publisher: { '@type': 'Organization', name: publisher, url: `${marketingOrigin}/` },
    blogPost: posts.slice(0, 20).map((post) => ({ '@type': 'BlogPosting', headline: post.title, url: new URL(`/blog/${post.slug}/`, `${marketingOrigin}/`).href, datePublished: post.date })),
  });
  return renderDocument({ title: `${title} | KidHabit Hero`, description, path, marketingOrigin, appOrigin, body, structuredData, extraHead: feedLink });
}

function relatedPosts(post, posts) {
  return posts
    .filter((other) => other.slug !== post.slug)
    .map((other) => ({ other, shared: other.tags.filter((tag) => post.tags.includes(tag)).length }))
    .sort((a, b) => b.shared - a.shared || b.other.date.localeCompare(a.other.date))
    .slice(0, 3)
    .map((entry) => entry.other);
}

export function renderBlogPost({ post, posts, marketingOrigin, appOrigin }) {
  const { html, headings } = renderMarkdown(post.body);
  const url = new URL(`/blog/${post.slug}/`, `${marketingOrigin}/`).href;
  const toc = headings.filter((heading) => heading.level === 2).length >= 3
    ? `<nav class="post-toc" aria-label="Nội dung bài viết"><p class="post-toc-title">${icon('list-checks')}Trong bài này</p><ol>${headings.filter((heading) => heading.level === 2).map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol></nav>`
    : '';
  const related = relatedPosts(post, posts);
  const relatedHtml = related.length ? `<section class="post-related" aria-labelledby="related-title"><h2 id="related-title">Bài viết liên quan</h2><ul class="blog-list">${related.map((entry) => renderPostCard(entry)).join('')}</ul></section>` : '';
  const updatedNote = post.updated !== post.date ? `<span aria-hidden="true">·</span><span>Cập nhật <time datetime="${post.updated}">${formatDate(post.updated)}</time></span>` : '';
  const body = `<main id="noi-dung">
  <section class="post-hero"><div class="shell post-shell">
    <nav class="crumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span aria-hidden="true">›</span><a href="/blog/">Blog</a></nav>
    ${post.tags.length ? `<ul class="blog-tags" aria-label="Chủ đề">${post.tags.map((tag) => `<li><a href="/blog/tag/${tag}/">${escapeHtml(tagLabel(tag))}</a></li>`).join('')}</ul>` : ''}
    <h1>${escapeHtml(post.title)}</h1>
    <p class="post-lede">${escapeHtml(post.description)}</p>
    <p class="blog-meta"><span>${escapeHtml(post.author)}</span><span aria-hidden="true">·</span><time datetime="${post.date}">${formatDate(post.date)}</time><span aria-hidden="true">·</span><span>${post.readingMinutes} phút đọc</span>${updatedNote}</p>
  </div></section>
  <section class="section post-body"><div class="shell post-shell">
    ${toc}
    <article class="prose">${html}</article>
    <aside class="post-cta"><img src="/mascots/${post.mascot}.webp" alt="" width="120" height="120" loading="lazy" decoding="async"><div><h2>Thử cùng con một thói quen nhỏ</h2><p>KidHabit giúp ba mẹ chọn thói quen phù hợp độ tuổi, đặt tín hiệu cùng con và xem lại những việc con đã làm.</p><div class="post-cta-actions"><a class="button" href="${appUrl(appOrigin, '/start')}">Dùng thử 7 ngày</a><a class="text-link" href="/science/">Xem cơ sở khoa học ${icon('arrow')}</a></div></div></aside>
    ${relatedHtml}
  </div></section></main>`;
  const structuredData = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated,
        inLanguage: 'vi',
        mainEntityOfPage: url,
        image: new URL('/og-image.jpg', `${marketingOrigin}/`).href,
        keywords: post.tags.map(tagLabel).join(', ') || undefined,
        author: { '@type': 'Organization', name: post.author },
        publisher: { '@type': 'Organization', name: publisher, url: `${marketingOrigin}/`, logo: { '@type': 'ImageObject', url: new URL('/logo.svg', `${marketingOrigin}/`).href } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${marketingOrigin}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: new URL('/blog/', `${marketingOrigin}/`).href },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  });
  const extraHead = `${feedLink}
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:modified_time" content="${post.updated}">
  <meta property="article:author" content="${escapeHtml(post.author)}">
  ${post.tags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tagLabel(tag))}">`).join('\n  ')}`;
  return renderDocument({ title: `${post.title} | Blog KidHabit Hero`, description: post.description, path: `/blog/${post.slug}/`, marketingOrigin, appOrigin, body, structuredData, ogType: 'article', extraHead });
}

const xml = (value) => escapeHtml(value);

export function renderFeed({ posts, marketingOrigin }) {
  const items = posts.slice(0, 30).map((post) => {
    const link = new URL(`/blog/${post.slug}/`, `${marketingOrigin}/`).href;
    return `    <item>
      <title>${xml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${xml(post.description)}</description>
${post.tags.map((tag) => `      <category>${xml(tagLabel(tag))}</category>`).join('\n')}
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog KidHabit Hero</title>
    <link>${marketingOrigin}/blog/</link>
    <description>Bài viết ngắn về thói quen của trẻ và cách ba mẹ đồng hành.</description>
    <language>vi</language>
    <atom:link href="${marketingOrigin}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

/** Every route the blog adds to the site, with the date it last changed. */
export function blogRoutes(posts) {
  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  const latest = posts[0]?.updated;
  return [
    { route: 'blog', lastmod: latest },
    ...posts.map((post) => ({ route: `blog/${post.slug}`, lastmod: post.updated })),
    ...tags.map((tag) => ({ route: `blog/tag/${tag}`, lastmod: posts.filter((post) => post.tags.includes(tag))[0]?.updated })),
  ];
}

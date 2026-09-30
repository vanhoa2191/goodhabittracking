import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BlogError, loadPosts, parsePost, renderMarkdown } from '../../apps/marketing/blog.mjs';
import { buildMarketingSite } from '../../scripts/build-marketing.mjs';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});
async function temporary(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  directories.push(directory);
  return directory;
}

const header = (extra = '') => `---\ntitle: Một bài viết thử\ndescription: Mô tả ngắn của bài viết thử.\ndate: 2026-09-30\n${extra}---\n\nNội dung bài.\n`;

describe('reading a post', () => {
  it('takes the slug from the file name and fills in the defaults', () => {
    const post = parsePost(header('tags: [thoi-quen, khoa-hoc]\nmascot: fox\n'), 'bai-viet-thu.md');
    expect(post).toMatchObject({ slug: 'bai-viet-thu', author: 'Đội ngũ KidHabit', tags: ['thoi-quen', 'khoa-hoc'], mascot: 'fox', updated: '2026-09-30', draft: false });
    expect(post.readingMinutes).toBe(1);
  });

  it('keeps quotation marks that belong to the title and drops only a pair wrapped around it', () => {
    expect(parsePost(header().replace('Một bài viết thử', 'Không có con số "21 ngày"'), 'a.md').title).toBe('Không có con số "21 ngày"');
    expect(parsePost(header().replace('Một bài viết thử', '"Đã bọc trong nháy"'), 'a.md').title).toBe('Đã bọc trong nháy');
  });

  it('refuses a post that would break the site or the search listing', () => {
    expect(() => parsePost(header(), 'Bai Viet.md')).toThrow(BlogError);
    expect(() => parsePost('Không có phần đầu', 'a.md')).toThrow(/header/);
    expect(() => parsePost(header().replace('title: Một bài viết thử\n', ''), 'a.md')).toThrow(/"title" is required/);
    expect(() => parsePost(header().replace('2026-09-30', '30/09/2026'), 'a.md')).toThrow(/YYYY-MM-DD/);
    expect(() => parsePost(header('updated: 2026-09-01\n'), 'a.md')).toThrow(/"updated"/);
    expect(() => parsePost(header().replace('Mô tả ngắn của bài viết thử.', 'x'.repeat(201)), 'a.md')).toThrow(/longer than 200/);
    expect(() => parsePost(header('mascot: dragon\n'), 'a.md')).toThrow(/mascot/);
    expect(() => parsePost(header('tags: [Thoi Quen]\n'), 'a.md')).toThrow(/tag/);
    expect(() => parsePost('---\ntitle: T\ndescription: D\ndate: 2026-09-30\n---\n', 'a.md')).toThrow(/no text/);
  });

  it('leaves drafts out and lists the newest post first', async () => {
    const directory = await temporary('kidhabit-blog-');
    await writeFile(join(directory, 'cu.md'), header().replace('2026-09-30', '2026-09-01'));
    await writeFile(join(directory, 'moi.md'), header().replace('2026-09-30', '2026-09-29'));
    await writeFile(join(directory, 'nhap.md'), header('draft: true\n'));
    await writeFile(join(directory, 'ghi-chu.txt'), 'không phải bài viết');
    expect((await loadPosts(directory)).map((post: { slug: string }) => post.slug)).toEqual(['moi', 'cu']);
    expect(await loadPosts(join(directory, 'khong-ton-tai'))).toEqual([]);
  });
});

describe('the markdown of a post', () => {
  it('escapes anything that looks like HTML', () => {
    const { html } = renderMarkdown('Xin chào <script>alert(1)</script> và <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('only turns safe addresses into links and marks outside links', () => {
    const { html } = renderMarkdown('[an toàn](/science/) [ngoài](https://example.com/a?b=1&c=2) [xấu](javascript:alert(1)) [khác](data:text/html;base64,AA)');
    expect(html).toContain('<a href="/science/">an toàn</a>');
    expect(html).toContain('<a href="https://example.com/a?b=1&amp;c=2" rel="noopener noreferrer">ngoài</a>');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('data:text');
    expect(html).toContain('xấu');
  });

  it('gives each heading a stable, unique anchor and refuses a second page title', () => {
    const { html, headings } = renderMarkdown('## Điều đầu tiên\n\nA\n\n## Điều đầu tiên\n\nB\n\n### Chi tiết\n\nC');
    expect(headings.map((heading: { id: string }) => heading.id)).toEqual(['dieu-dau-tien', 'dieu-dau-tien-2', 'chi-tiet']);
    expect(html).toContain('<h2 id="dieu-dau-tien">Điều đầu tiên</h2>');
    expect(() => renderMarkdown('# Tiêu đề thứ hai')).toThrow(/##/);
  });

  it('renders lists, quotes, emphasis and rules', () => {
    const { html } = renderMarkdown('- một\n- hai\n\n1. đầu\n2. sau\n\n> Trích dẫn\n\n---\n\n**đậm** và *nghiêng* và `mã`');
    expect(html).toContain('<ul><li>một</li><li>hai</li></ul>');
    expect(html).toContain('<ol><li>đầu</li><li>sau</li></ol>');
    expect(html).toContain('<blockquote><p>Trích dẫn</p></blockquote>');
    expect(html).toContain('<hr>');
    expect(html).toContain('<strong>đậm</strong>');
    expect(html).toContain('<em>nghiêng</em>');
    expect(html).toContain('<code>mã</code>');
  });
});

describe('the built blog', () => {
  async function buildWith(posts: Record<string, string>) {
    const blogDirectory = await temporary('kidhabit-blog-src-');
    for (const [name, source] of Object.entries(posts)) await writeFile(join(blogDirectory, name), source);
    const outputDir = await temporary('kidhabit-blog-out-');
    await buildMarketingSite({ appOrigin: 'https://app.example', marketingOrigin: 'https://www.example', outputDir, blogDirectory });
    return outputDir;
  }
  const posts = {
    'mot.md': header('tags: [thoi-quen]\nupdated: 2026-10-02\n').replace('Nội dung bài.', '## A\n\nx\n\n## B\n\ny\n\n## C\n\nz'),
    'hai.md': header('tags: [thoi-quen, khoa-hoc]\n').replace('Một bài viết thử', 'Bài thứ hai').replace('2026-09-30', '2026-09-20'),
    'nhap.md': header('draft: true\n'),
  };

  it('writes the index, one page per post, one per topic and a feed', async () => {
    const out = await buildWith(posts);
    for (const path of ['blog/index.html', 'blog/mot/index.html', 'blog/hai/index.html', 'blog/tag/thoi-quen/index.html', 'blog/tag/khoa-hoc/index.html', 'blog/feed.xml']) {
      await expect(readFile(join(out, path), 'utf8')).resolves.toBeTruthy();
    }
    await expect(readFile(join(out, 'blog/nhap/index.html'), 'utf8')).rejects.toThrow();
  });

  it('gives every post what search engines and sharing need', async () => {
    const out = await buildWith(posts);
    const html = await readFile(join(out, 'blog/mot/index.html'), 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://www.example/blog/mot/">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="article:published_time" content="2026-09-30">');
    expect(html).toContain('<meta property="article:modified_time" content="2026-10-02">');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml"');
    expect(html).toContain('<title>Một bài viết thử | Blog KidHabit Hero</title>');
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    const article = data['@graph'].find((item: { '@type': string }) => item['@type'] === 'BlogPosting');
    expect(article).toMatchObject({ headline: 'Một bài viết thử', datePublished: '2026-09-30', dateModified: '2026-10-02', inLanguage: 'vi', mainEntityOfPage: 'https://www.example/blog/mot/' });
    expect(data['@graph'].find((item: { '@type': string }) => item['@type'] === 'BreadcrumbList').itemListElement).toHaveLength(3);
  });

  it('adds a contents list to a long post, a way back to the product and related posts', async () => {
    const out = await buildWith(posts);
    const html = await readFile(join(out, 'blog/mot/index.html'), 'utf8');
    expect(html).toContain('class="post-toc"');
    expect(html).toContain('href="https://app.example/start"');
    expect(html).toContain('Bài viết liên quan');
    expect(html).toContain('href="/blog/hai/"');
  });

  it('lists the published posts in the sitemap with their last change, and in the feed', async () => {
    const out = await buildWith(posts);
    const sitemap = await readFile(join(out, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://www.example/blog/</loc>');
    expect(sitemap).toContain('<loc>https://www.example/blog/mot/</loc><lastmod>2026-10-02</lastmod>');
    expect(sitemap).toContain('<loc>https://www.example/blog/tag/khoa-hoc/</loc>');
    expect(sitemap).not.toContain('/blog/nhap/');
    const feed = await readFile(join(out, 'blog/feed.xml'), 'utf8');
    expect(feed).toContain('<link>https://www.example/blog/mot/</link>');
    expect(feed).not.toContain('nhap');
  });

  it('links the blog from the header, the footer and the information tabs, and still builds with no posts', async () => {
    const out = await buildWith({});
    const home = await readFile(join(out, 'index.html'), 'utf8');
    expect(home).toContain('<a href="/blog/">Blog</a>');
    const index = await readFile(join(out, 'blog/index.html'), 'utf8');
    expect(index).toContain('sắp ra mắt');
    const sitemap = await readFile(join(out, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://www.example/blog/</loc>');
  });
});

describe('the posts published in this repository', () => {
  const banned = /đảm bảo|chắc chắn|cam kết|chứng minh (?:được )?rằng|100%|hiệu quả tuyệt đối|khỏi bệnh|chữa/i;

  it('are valid, findable and do not promise results for a child', async () => {
    const posts = await loadPosts(resolve('apps/marketing/blog'));
    expect(posts.length).toBeGreaterThanOrEqual(3);
    expect(new Set(posts.map((post: { slug: string }) => post.slug)).size).toBe(posts.length);
    for (const post of posts as { slug: string; title: string; description: string; body: string }[]) {
      expect(post.title.length, post.slug).toBeLessThanOrEqual(90);
      expect(post.description.length, post.slug).toBeGreaterThanOrEqual(80);
      expect(post.description.length, post.slug).toBeLessThanOrEqual(200);
      expect(`${post.title}\n${post.description}\n${post.body}`, post.slug).not.toMatch(banned);
      expect(post.body, `${post.slug} needs an internal link`).toMatch(/\]\(\/(?:science|framework|blog)\//);
      expect(post.body, `${post.slug} must say where the evidence stops`).toMatch(/giới hạn|chưa có|chưa biết|không thay thế/i);
    }
  });
});

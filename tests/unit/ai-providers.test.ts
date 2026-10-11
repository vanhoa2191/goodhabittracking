import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveProvider, selectProvider } from '@/lib/ai/providers';

const messages = [{ role: 'system' as const, content: 's' }, { role: 'user' as const, content: 'u' }];
const schema = { type: 'object' };
const workersRun = vi.fn();
const binding = { run: workersRun };

afterEach(() => { vi.restoreAllMocks(); workersRun.mockReset(); });

describe('selectProvider', () => {
  it('resolves availability without asking a model or falling back', () => {
    expect(resolveProvider({}, { binding }).available).toBe(true);
    expect(resolveProvider({}, { binding: null }).available).toBe(false);
    expect(resolveProvider({ AI_PROVIDER: 'deepseek' }, { binding }).available).toBe(false);
    expect(resolveProvider({ AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'k' }, { binding: null }).available).toBe(true);
    expect(resolveProvider({ AI_KILL_SWITCH: 'true', AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'k' }, { binding }).available).toBe(false);
    expect(workersRun).not.toHaveBeenCalled();
  });

  it('uses Workers AI by default and for an unknown value', () => {
    expect(selectProvider({}, { binding }).name).toBe('workers');
    expect(selectProvider({ AI_PROVIDER: 'nonsense' }, { binding }).name).toBe('workers');
  });

  it('calls the Workers binding', async () => {
    workersRun.mockResolvedValue({ response: '{"a":1}' });
    expect(await selectProvider({ AI_PROVIDER: 'workers' }, { binding }).ask(messages, { schema })).toEqual({ ok: true, reply: '{"a":1}' });
    expect(workersRun.mock.calls[0]?.[1]).toMatchObject({ messages, response_format: { type: 'json_schema' } });
  });

  it('is disabled when Workers has no binding', async () => {
    expect(await selectProvider({}, { binding: null }).ask(messages, { schema })).toEqual({ ok: false, reason: 'disabled' });
  });

  it('fails closed for DeepSeek without a key and never calls Workers or the network', async () => {
    const fetcher = vi.fn();
    for (const env of [{ AI_PROVIDER: 'deepseek' }, { AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: '' }]) {
      const provider = selectProvider(env, { binding, fetch: fetcher });
      expect(await provider.ask(messages, { schema })).toEqual({ ok: false, reason: 'disabled' });
    }
    expect(workersRun).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not use DeepSeek just because a key exists', () => {
    expect(selectProvider({ DEEPSEEK_API_KEY: 'k' }, { binding }).name).toBe('workers');
  });

  it('asks DeepSeek over the OpenAI-compatible endpoint with the defaults', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"a":1}' } }] }), { status: 200 }));
    const provider = selectProvider({ AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'secret' }, { binding, fetch: fetcher });
    expect(provider.name).toBe('deepseek');
    expect(await provider.ask(messages, { schema })).toEqual({ ok: true, reply: '{"a":1}' });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret');
    expect(JSON.parse(String(init.body))).toMatchObject({ model: 'deepseek-chat', messages, response_format: { type: 'json_object' } });
    expect(workersRun).not.toHaveBeenCalled();
  });

  it('honours DEEPSEEK_BASE_URL and DEEPSEEK_MODEL', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }));
    await selectProvider({ AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'k', DEEPSEEK_BASE_URL: 'https://proxy.example/', DEEPSEEK_MODEL: 'deepseek-reasoner' }, { fetch: fetcher }).ask(messages, { schema });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://proxy.example/chat/completions');
    expect(JSON.parse(String(init.body)).model).toBe('deepseek-reasoner');
  });

  it('maps DeepSeek failures: 402/429 → quota, bad status/body → error, slow → timeout', async () => {
    const run = (fetcher: typeof fetch, timeoutMs?: number) => selectProvider({ AI_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'k' }, { fetch: fetcher }).ask(messages, { schema, timeoutMs });
    expect(await run(async () => new Response('{}', { status: 429 }))).toEqual({ ok: false, reason: 'quota' });
    expect(await run(async () => new Response('{}', { status: 402 }))).toEqual({ ok: false, reason: 'quota' });
    expect(await run(async () => new Response('{}', { status: 500 }))).toEqual({ ok: false, reason: 'error' });
    expect(await run(async () => new Response('{}', { status: 200 }))).toEqual({ ok: false, reason: 'error' });
    expect(await run(async () => { throw new Error('boom'); })).toEqual({ ok: false, reason: 'error' });
    expect(await run((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))), 20)).toEqual({ ok: false, reason: 'timeout' });
  });
});

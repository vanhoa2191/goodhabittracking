export async function requestParentLock(fetcher: typeof fetch = fetch): Promise<void> {
  let response: Response;
  try {
    response = await fetcher('/api/parent-pin', { method: 'DELETE', cache: 'no-store' });
  } catch {
    throw new Error('parent_lock_failed');
  }
  if (!response.ok) throw new Error('parent_lock_failed');
}

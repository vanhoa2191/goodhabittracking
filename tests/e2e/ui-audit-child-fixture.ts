import { expect, type Page, type Route } from '@playwright/test';
import { childDomainCommandSchema, type ChildDomainCommand } from '../../src/lib/domain/commands';
import type { ChildSession } from '../../src/lib/store/pairing-client';

export const childId = '44444444-4444-4444-8444-444444444444';
export const activityId = '55555555-5555-4555-8555-555555555555';
export const rewardId = '66666666-6666-4666-8666-666666666666';
export const day = '2026-10-19';
export const now = new Date(`${day}T09:00:00+07:00`);

export type CapturedCommand = { command: ChildDomainCommand; route: Route };

// Same exchange -> POST session path as pair-link.spec.ts, never demo/local-store injection.
// All identities/data are synthetic. Only these explicit API boundaries are mocked.
export async function pairedChild(page: Page, options: {
  approval?: boolean; timer?: boolean; profile?: Partial<ChildSession['child']>;
  empty?: boolean; description?: string; icon?: string;
} = {}) {
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  const session: ChildSession = {
    familyPausedAt: null, familyPausePeriods: [], weeklyFocus: [],
    child: {
      id: childId, name: 'Bé Hồi Phục', avatar: 'mascot:leo', themeColor: '#3B82F6',
      points: 40, totalEarned: 40, level: 1, streak: 0, ageStage: '6-12', birthYear: 2017,
      createdAt: '2026-09-20T00:00:00.000Z',
      ...options.profile,
    },
    activities: [{
      id: activityId, childId, title: 'Cất sách sau khi đọc', icon: '📚', category: 'kindness',
      points: 10, recurrenceType: 'daily', recurrenceDays: [], timeOfDay: 'anytime',
      requiresApproval: options.approval ?? false, durationMinutes: options.timer ? 1 : undefined,
      description: options.description, ...(options.icon ? { icon: options.icon } : {}),
      isActive: true, createdAt: '2026-09-20T00:00:00.000Z',
    }],
    logs: [], redemptions: [],
    rewards: [{ id: rewardId, title: 'Chọn truyện cùng nhà', icon: '📖', costPoints: 15,
      stock: -1, isActive: true, createdAt: '2026-09-20T00:00:00.000Z' }],
  };
  if (options.empty) session.activities = [];
  const commands: CapturedCommand[] = [];
  const sessionMethods: string[] = [];
  let exchanges = 0;
  let paired = false;
  let refreshAvailable = true;
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status, contentType: 'application/json', body: JSON.stringify(body),
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: now });
  await page.clock.setFixedTime(now);
  await page.context().addCookies([{ name: 'kidhabit_language', value: 'vi', url: 'http://localhost:3107' }]);
  const token = 'b'.repeat(48);
  await page.route('**/api/pairing/exchange', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({ token });
    exchanges += 1;
    paired = true;
    await json(route, { success: true });
  });
  await page.route('**/api/child/session', async (route) => {
    sessionMethods.push(route.request().method());
    if (paired && !refreshAvailable) { await json(route, { error: 'Snapshot unavailable.' }, 503); return; }
    await json(route, paired ? session : { error: 'Thiết bị chưa được ghép nối.' }, paired ? 200 : 401);
  });
  await page.route('**/api/child/commands', (route) => {
    expect(route.request().method()).toBe('POST');
    commands.push({ command: childDomainCommandSchema.parse(route.request().postDataJSON()), route });
    console.info(`[synthetic child command ${commands.length}] ${JSON.stringify(commands.at(-1)?.command)}`);
    // The test explicitly acknowledges/refuses each command; no optimistic fixture mutation.
  });
  const foreignCommands: string[] = [];
  await page.route('**/api/domain/commands', async (route) => {
    foreignCommands.push(route.request().postData() ?? '');
    await json(route, { success: false, error: 'Child device session required.' }, 401);
  });
  await page.route('**/api/child/wishlist', (route) => json(route, { wishlist: {
    family_id: '88888888-8888-4888-8888-888888888888', child_id: childId,
    reward_id: rewardId, chosen_at: now.toISOString(),
  } }));
  await page.route('**/api/child/journal', (route) => json(route, { entries: [] }));
  await page.route('**/api/child/habit-programs', (route) => json(route, { supportObservations: [], cuePlans: [] }));
  await page.route('**/api/child/task-deferrals', (route) => json(route, { deferredTasks: [] }));
  await page.goto(`/?pair=${token}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', 'kid', { timeout: 20_000 });
  const card = page.locator(`[data-task-card][data-activity-id="${activityId}"]`);
  if (options.empty) await expect(card).toHaveCount(0);
  else await expect(card).toBeVisible();
  expect(exchanges).toBe(1);
  expect(sessionMethods).toContain('POST');
  expect(page.url()).not.toContain('pair=');

  return {
    card, session, commands, foreignCommands, sessionMethods,
    setRefreshAvailable(value: boolean) { refreshAvailable = value; },
    balance: (points: number) => page.getByText(String(points), { exact: true }).first(),
    async received(count: number) {
      await expect.poll(() => commands.length).toBeGreaterThanOrEqual(count);
      return commands[count - 1];
    },
    async refuse(entry: CapturedCommand) {
      // Exact child route RPC-failure status/body; correlationId is diagnostic, not child prose.
      await json(entry.route, { success: false, error: 'The child action could not be saved.', correlationId: 'synthetic-child-recovery' }, 409);
    },
    async complete(entry: CapturedCommand, pending = false) {
      expect(entry.command.type).toBe('completeHabit');
      if (entry.command.type !== 'completeHabit') throw new Error('Fixture can only acknowledge completeHabit here.');
      // SQL uses command_id as activity_logs.id and the response logId.
      const logId = entry.command.commandId;
      session.logs = [{ id: logId, activityId, childId, date: day,
        status: pending ? 'pending_approval' : 'completed', pointsAwarded: pending ? 0 : 10,
        completedAt: now.toISOString() }];
      session.child.points = pending ? 40 : 50;
      session.child.totalEarned = pending ? 40 : 50;
      if (!pending) {
        session.child.streak = 1;
        session.child.lastActiveDate = day;
      }
      await json(entry.route, { success: true, result: {
        status: pending ? 'pending_approval' : 'completed', logId, pointsAwarded: pending ? 0 : 10,
      } });
    },
  };
}

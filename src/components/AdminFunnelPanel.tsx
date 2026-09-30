import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { parseFunnelRows, parseRetention, summarizeFunnel, type FunnelStep } from '@/lib/admin/funnel';

const LABELS: Readonly<Record<FunnelStep['key'], string>> = {
  families: 'Gia đình đăng ký',
  withChild: 'Đã tạo hồ sơ bé',
  withPairedDevice: 'Đã ghép thiết bị của bé',
  withFirstCompletion: 'Bé đã hoàn thành việc đầu tiên',
  withTrial: 'Đã bắt đầu dùng thử',
  withPayment: 'Đã thanh toán',
};

function percent(share: number | null): string {
  return share === null ? '–' : `${Math.round(share * 100)}%`;
}

// The numbers are a convenience; if the service client is not configured or the query fails, the rest
// of the admin page must still work.
async function loadFunnel(windowDays: number) {
  try {
    const admin = createAdminSupabaseClient();
    const [funnel, retention] = await Promise.all([
      admin.rpc('admin_activation_funnel', { window_days: windowDays }),
      admin.rpc('admin_retention_snapshot'),
    ]);
    return { funnel, retention };
  } catch {
    return null;
  }
}

export async function AdminFunnelPanel({ windowDays = 30 }: { readonly windowDays?: number }) {
  const loaded = await loadFunnel(windowDays);
  const funnel = loaded?.funnel;
  const retention = loaded?.retention;
  if (!funnel || !retention || funnel.error || retention.error) {
    return (
      <section aria-labelledby="funnel-title" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="funnel-title" className="text-lg font-black">Phễu kích hoạt</h2>
        <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">Chưa tải được số liệu. Thử lại sau.</p>
      </section>
    );
  }

  const rows = parseFunnelRows(funnel.data);
  const steps = summarizeFunnel(rows);
  const snapshot = parseRetention(retention.data);
  const cards: ReadonlyArray<readonly [string, number]> = [
    ['Tổng số gia đình', snapshot.familiesTotal],
    ['Có hồ sơ bé', snapshot.familiesWithChild],
    ['Hoạt động 7 ngày qua', snapshot.activeLast7Days],
    ['Hoạt động 30 ngày qua', snapshot.activeLast30Days],
    ['Đang trả phí', snapshot.payingNow],
  ];

  return (
    <section aria-labelledby="funnel-title" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 id="funnel-title" className="text-lg font-black">Phễu kích hoạt</h2>
        <p className="mt-1 text-sm text-slate-500">Chỉ là số đếm theo ngày đăng ký của gia đình, {windowDays} ngày gần nhất. Không có tên, email hay mã định danh.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800">
            <dt className="text-xs font-bold text-slate-500">{label}</dt>
            <dd className="mt-1 text-2xl font-black tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="flex justify-between text-sm"><span className="font-bold">{LABELS[step.key]}</span><span className="tabular-nums text-slate-500">{step.count} · {percent(step.share)}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round((step.share ?? 0) * 100)}%` }} /></div>
            </div>
          </li>
        ))}
      </ol>
      {rows.length === 0 && <p className="text-sm text-slate-500">Chưa có gia đình nào đăng ký trong khoảng này.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2 pr-3">Ngày đăng ký</th>{steps.map((step) => <th key={step.key} className="py-2 pr-3">{LABELS[step.key]}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.cohortDay} className="border-t border-slate-100 dark:border-zinc-800">
                  <th scope="row" className="py-2 pr-3 font-bold">{row.cohortDay}</th>
                  <td className="py-2 pr-3 tabular-nums">{row.families}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.withChild}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.withPairedDevice}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.withFirstCompletion}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.withTrial}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.withPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

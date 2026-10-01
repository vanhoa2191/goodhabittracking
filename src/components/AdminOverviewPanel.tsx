import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type Counts = {
  readonly payoutsWaiting: number;
  readonly payoutAmount: number;
  readonly casesOpen: number;
  readonly ordersPending: number;
  readonly paying: number;
  readonly trialing: number;
  readonly expiring: number;
};

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

async function count(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count: value, error } = await query;
  return error ? 0 : (value ?? 0);
}

async function load(): Promise<Counts | null> {
  try {
    const admin = createAdminSupabaseClient();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000).toISOString();
    const weekAhead = new Date(now.getTime() + 7 * 86_400_000).toISOString();
    const head = { count: 'exact', head: true } as const;
    const [affiliate, casesOpen, ordersPending, paying, trialing, expiring] = await Promise.all([
      admin.rpc('admin_affiliate_overview'),
      count(admin.from('billing_support_cases').select('id', head).in('status', ['requested', 'reviewing', 'approved'])),
      count(admin.from('payment_orders').select('id', head).eq('status', 'PENDING').gte('created_at', dayAgo)),
      count(admin.from('user_subscriptions').select('family_id', head).eq('status', 'active').in('plan', ['solo_monthly', 'monthly', 'yearly', 'lifetime'])),
      count(admin.from('user_subscriptions').select('family_id', head).eq('status', 'active').eq('plan', 'trial').gt('trial_ends_at', now.toISOString())),
      count(admin.from('user_subscriptions').select('family_id', head).eq('status', 'active').in('plan', ['solo_monthly', 'monthly', 'yearly'])
        .gt('subscription_ends_at', now.toISOString()).lte('subscription_ends_at', weekAhead)),
    ]);
    const payouts = ((affiliate.data as { payouts?: Array<{ status: string; amount: number }> } | null)?.payouts ?? [])
      .filter((payout) => payout.status === 'requested');
    return {
      payoutsWaiting: payouts.length,
      payoutAmount: payouts.reduce((sum, payout) => sum + payout.amount, 0),
      casesOpen,
      ordersPending,
      paying,
      trialing,
      expiring,
    };
  } catch {
    return null;
  }
}

function Task({ href, count: value, title, detail }: { readonly href: string; readonly count: number; readonly title: string; readonly detail: string }) {
  const urgent = value > 0;
  return (
    <a href={href} className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${urgent ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900'}`}>
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-2xl font-black tabular-nums ${urgent ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>{value}</span>
      <span className="min-w-0">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-slate-600 dark:text-slate-300">{urgent ? detail : 'Không có việc cần xử lý.'}</span>
      </span>
    </a>
  );
}

/** What needs a person today, then the few numbers that say how the business is doing. */
export async function AdminOverviewPanel() {
  const counts = await load();
  if (!counts) {
    return <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">Chưa tải được số liệu tổng quan. Các tab khác vẫn dùng được.</p>;
  }
  const kpis: ReadonlyArray<readonly [string, number, string]> = [
    ['Gia đình trả phí', counts.paying, 'Đang hoạt động'],
    ['Đang dùng thử', counts.trialing, 'Còn hạn'],
    ['Sắp hết hạn', counts.expiring, 'Trong 7 ngày tới, gói trả phí'],
  ];
  return (
    <section aria-labelledby="overview-title" className="space-y-6">
      <div>
        <h2 id="overview-title" className="text-xl font-black">Cần xử lý</h2>
        <p className="mt-1 text-sm text-slate-500">Bấm một mục để mở đúng tab.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Task href="#gioi-thieu" count={counts.payoutsWaiting} title="Yêu cầu rút hoa hồng" detail={`${money(counts.payoutAmount)} chờ chuyển khoản`} />
          <Task href="#thanh-toan" count={counts.casesOpen} title="Hồ sơ thanh toán đang mở" detail="Hỗ trợ, hoàn tiền hoặc hủy chưa hoàn tất" />
          <Task href="#thanh-toan" count={counts.ordersPending} title="Đơn chờ thanh toán (24 giờ)" detail="Khách đã tạo đơn nhưng chưa trả" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-black">Tình hình gói</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {kpis.map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <dt className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</dt>
              <dd className="mt-1 text-3xl font-black tabular-nums">{value}</dd>
              <p className="text-xs text-slate-500">{note}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

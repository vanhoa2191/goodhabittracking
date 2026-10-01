import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { AdminAffiliatePayoutActions } from '@/components/AdminAffiliatePayoutActions';

type Payout = {
  readonly id: string;
  readonly amount: number;
  readonly status: 'requested' | 'paid' | 'rejected';
  readonly bank: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly requestedAt: string;
  readonly resolvedAt: string | null;
  readonly reference: string | null;
};

type Overview = {
  readonly affiliates: number;
  readonly referrals: number;
  readonly owed: { readonly held: number; readonly available: number; readonly requested: number; readonly paid: number };
  readonly payouts: readonly Payout[];
};

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

async function load(): Promise<Overview | null> {
  try {
    const { data, error } = await createAdminSupabaseClient().rpc('admin_affiliate_overview');
    return error || !data ? null : data as Overview;
  } catch {
    return null;
  }
}

/** Referral programme totals and the withdrawal requests waiting for a manual bank transfer. */
export async function AdminAffiliatePanel() {
  const overview = await load();
  if (!overview) {
    return (
      <section aria-labelledby="affiliate-admin-title" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="affiliate-admin-title" className="text-lg font-black">Chương trình giới thiệu</h2>
        <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">Chưa tải được số liệu. Thử lại sau.</p>
      </section>
    );
  }
  const waiting = overview.payouts.filter((payout) => payout.status === 'requested');
  const recent = overview.payouts.filter((payout) => payout.status !== 'requested').slice(0, 10);
  const cards: ReadonlyArray<readonly [string, string]> = [
    ['Người giới thiệu', String(overview.affiliates)],
    ['Gia đình được giới thiệu', String(overview.referrals)],
    ['Đang giữ', money(overview.owed.held)],
    ['Có thể rút', money(overview.owed.available)],
    ['Chờ chuyển khoản', money(overview.owed.requested)],
    ['Đã chuyển', money(overview.owed.paid)],
  ];
  return (
    <section aria-labelledby="affiliate-admin-title" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 id="affiliate-admin-title" className="text-lg font-black">Chương trình giới thiệu</h2>
        <p className="mt-1 text-sm text-slate-500">Hoa hồng 30% mỗi đơn, giữ 35 ngày. Chuyển khoản thủ công rồi ghi mã giao dịch; hoàn tiền xác nhận ở mục thanh toán sẽ tự thu hồi hoa hồng còn đang giữ.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800">
            <dt className="text-xs font-bold text-slate-500">{label}</dt>
            <dd className="mt-1 text-lg font-black tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="text-sm font-extrabold">Yêu cầu rút tiền đang chờ ({waiting.length})</h3>
      {waiting.length === 0 && <p className="text-sm text-slate-500">Không có yêu cầu nào.</p>}
      <ul className="space-y-3">
        {waiting.map((payout) => (
          <li key={payout.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-black tabular-nums">{money(payout.amount)}</p>
            <p className="text-sm">{payout.bank} · {payout.accountNumber} · {payout.accountName}</p>
            <p className="text-xs text-slate-500">Yêu cầu lúc {new Date(payout.requestedAt).toLocaleString('vi-VN')}</p>
            <AdminAffiliatePayoutActions payoutId={payout.id} />
          </li>
        ))}
      </ul>
      {recent.length > 0 && (
        <>
          <h3 className="text-sm font-extrabold">Đã xử lý gần đây</h3>
          <ul className="divide-y divide-slate-100 text-sm dark:divide-zinc-800">
            {recent.map((payout) => (
              <li key={payout.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{payout.accountName} · {money(payout.amount)}</span>
                <span className="text-slate-500">{payout.status === 'paid' ? `Đã chuyển · ${payout.reference ?? ''}` : 'Đã từ chối'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

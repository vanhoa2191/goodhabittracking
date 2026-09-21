'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

type Subscription = {
  readonly plan: 'free' | 'trial' | 'monthly' | 'yearly';
  readonly status: 'active' | 'inactive' | 'cancelled';
  readonly subscription_ends_at: string | null;
  readonly trial_ends_at: string | null;
};

type Customer = {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string;
  readonly marketingConsent: boolean;
  readonly tags: readonly string[];
  readonly notes: string;
  readonly familyId: string | null;
  readonly subscription: Subscription | null;
};

type Coupon = {
  readonly id: string;
  readonly code: string;
  readonly bonus_days: number | null;
  readonly active: boolean;
  readonly redeemed_count: number;
  readonly max_redemptions: number | null;
  readonly expires_at: string | null;
};

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800';
const planSchema = z.enum(['free', 'trial', 'monthly', 'yearly']);
const subscriptionStatusSchema = z.enum(['active', 'inactive', 'cancelled']);

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

function subscriptionEnd(subscription: Subscription | null) {
  return subscription?.plan === 'trial'
    ? subscription.trial_ends_at
    : subscription?.subscription_ends_at;
}

export function AdminCustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [bonusDays, setBonusDays] = useState(30);
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [customerResponse, couponResponse] = await Promise.all([
      fetch('/api/admin/customers'),
      fetch('/api/admin/coupons'),
    ]);
    if (!customerResponse.ok) {
      setError(customerResponse.status === 403
        ? 'Tài khoản này không có quyền quản trị.'
        : 'Không tải được dữ liệu khách hàng.');
      setLoading(false);
      return;
    }
    const customerBody = await customerResponse.json() as { customers: Customer[] };
    setCustomers(customerBody.customers);
    if (couponResponse.ok) {
      const couponBody = await couponResponse.json() as { coupons: Coupon[] };
      setCoupons(couponBody.coupons);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const visibleCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) =>
      `${customer.fullName} ${customer.email} ${customer.phone} ${customer.tags.join(' ')}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [customers, query]);

  const updateCustomer = (userId: string, patch: Partial<Customer>) => {
    setCustomers((current) => current.map((customer) =>
      customer.id === userId ? { ...customer, ...patch } : customer
    ));
  };

  const updateSubscription = (customer: Customer, patch: Partial<Subscription>) => {
    const current = customer.subscription ?? {
      plan: 'free' as const,
      status: 'inactive' as const,
      subscription_ends_at: null,
      trial_ends_at: null,
    };
    updateCustomer(customer.id, { subscription: { ...current, ...patch } });
  };

  const saveCustomer = async (customer: Customer) => {
    setError('');
    const response = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        marketingConsent: customer.marketingConsent,
        tags: customer.tags,
        notes: customer.notes,
      }),
    });
    if (!response.ok) {
      setError('Không lưu được thông tin khách hàng.');
      return;
    }
    setNotice(`Đã lưu hồ sơ ${customer.fullName || customer.email}.`);
  };

  const saveSubscription = async (customer: Customer) => {
    if (!customer.familyId) return;
    const subscription = customer.subscription ?? {
      plan: 'free' as const,
      status: 'inactive' as const,
      subscription_ends_at: null,
      trial_ends_at: null,
    };
    const endDate = subscriptionEnd(subscription);
    const response = await fetch('/api/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        familyId: customer.familyId,
        plan: subscription.plan,
        status: subscription.plan === 'free' ? 'inactive' : subscription.status,
        endsAt: endDate ? new Date(`${toDateInput(endDate)}T23:59:59.000Z`).toISOString() : null,
      }),
    });
    if (!response.ok) {
      setError('Không cập nhật được gói đăng ký.');
      return;
    }
    setNotice(`Đã cập nhật gói của ${customer.fullName || customer.email}.`);
    await load();
  };

  const createCoupon = async () => {
    setError('');
    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code: couponCode,
        description: 'Mã tặng từ chăm sóc khách hàng',
        discountPercent: null,
        bonusDays,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: couponExpiry ? new Date(`${couponExpiry}T23:59:59.000Z`).toISOString() : null,
        active: true,
      }),
    });
    if (!response.ok) {
      setError('Không tạo được coupon. Kiểm tra lại mã và giới hạn sử dụng.');
      return;
    }
    setCouponCode('');
    setNotice('Đã tạo coupon mới.');
    await load();
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</p>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, email, số điện thoại hoặc nhãn" className={`${inputClass} flex-1`} />
          <span className="text-sm font-bold">{visibleCustomers.length} thành viên</span>
        </div>

        {loading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải khách hàng…</p> : (
          <div className="space-y-4">
            {visibleCustomers.map((customer) => (
              <article key={customer.id} className="rounded-2xl border border-slate-200 p-4 dark:border-zinc-700">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold">Họ và tên
                      <input value={customer.fullName} onChange={(event) => updateCustomer(customer.id, { fullName: event.target.value })} className={`${inputClass} mt-1`} />
                    </label>
                    <label className="block text-xs font-bold">Số điện thoại
                      <input value={customer.phone} onChange={(event) => updateCustomer(customer.id, { phone: event.target.value })} inputMode="tel" className={`${inputClass} mt-1`} />
                    </label>
                    <p className="break-all text-xs text-slate-500">{customer.email}</p>
                    <label className="flex items-start gap-2 text-xs">
                      <input type="checkbox" checked={customer.marketingConsent} onChange={(event) => updateCustomer(customer.id, { marketingConsent: event.target.checked })} className="mt-0.5" />
                      Khách hàng đồng ý nhận thông tin tiếp thị
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-bold">Gói
                        <select value={customer.subscription?.plan ?? 'free'} disabled={!customer.familyId} onChange={(event) => updateSubscription(customer, { plan: planSchema.parse(event.target.value) })} className={`${inputClass} mt-1`}>
                          <option value="free">Miễn phí</option>
                          <option value="trial">Dùng thử</option>
                          <option value="monthly">Theo tháng</option>
                          <option value="yearly">Theo năm</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold">Trạng thái
                        <select value={customer.subscription?.status ?? 'inactive'} disabled={!customer.familyId || customer.subscription?.plan === 'free'} onChange={(event) => updateSubscription(customer, { status: subscriptionStatusSchema.parse(event.target.value) })} className={`${inputClass} mt-1`}>
                          <option value="active">Đang hoạt động</option>
                          <option value="inactive">Chưa hoạt động</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </label>
                    </div>
                    <label className="block text-xs font-bold">Ngày hết hạn
                      <input
                        type="date"
                        value={toDateInput(subscriptionEnd(customer.subscription))}
                        disabled={!customer.familyId || customer.subscription?.plan === 'free'}
                        onChange={(event) => {
                          const value = event.target.value ? `${event.target.value}T23:59:59.000Z` : null;
                          updateSubscription(customer, customer.subscription?.plan === 'trial'
                            ? { trial_ends_at: value }
                            : { subscription_ends_at: value });
                        }}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <button type="button" disabled={!customer.familyId} onClick={() => void saveSubscription(customer)} className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50">Lưu gói đăng ký</button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold">Nhãn chăm sóc, cách nhau bằng dấu phẩy
                      <input value={customer.tags.join(', ')} onChange={(event) => updateCustomer(customer.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className={`${inputClass} mt-1`} />
                    </label>
                    <label className="block text-xs font-bold">Ghi chú chăm sóc khách hàng
                      <textarea value={customer.notes} onChange={(event) => updateCustomer(customer.id, { notes: event.target.value })} rows={3} className={`${inputClass} mt-1 py-2`} />
                    </label>
                    <button type="button" onClick={() => void saveCustomer(customer)} className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">Lưu hồ sơ khách hàng</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-black">Coupon tặng ngày sử dụng</h2>
        <p className="mt-1 text-sm text-slate-500">Mỗi gia đình chỉ dùng một lần cho mỗi mã.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="VD: TANG30NGAY" className={inputClass} />
          <input type="number" min={1} max={3650} value={bonusDays} onChange={(event) => setBonusDays(Number(event.target.value))} aria-label="Số ngày tặng" className={inputClass} />
          <input type="number" min={1} value={maxRedemptions} onChange={(event) => setMaxRedemptions(event.target.value)} placeholder="Lượt dùng, bỏ trống = không giới hạn" className={inputClass} />
          <input type="date" value={couponExpiry} onChange={(event) => setCouponExpiry(event.target.value)} aria-label="Ngày hết hạn coupon" className={inputClass} />
        </div>
        <button type="button" onClick={() => void createCoupon()} className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Tạo coupon</button>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-zinc-700">
              <b>{coupon.code}</b>
              <span className="ml-2 text-slate-500">+{coupon.bonus_days} ngày · đã dùng {coupon.redeemed_count}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''}</span>
              <p className="mt-1 text-xs text-slate-500">{coupon.active ? 'Đang hoạt động' : 'Đã tắt'}{coupon.expires_at ? ` · hết hạn ${toDateInput(coupon.expires_at)}` : ''}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

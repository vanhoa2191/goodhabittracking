'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

type Subscription = {
  readonly plan: 'free' | 'trial' | 'solo_monthly' | 'monthly' | 'yearly' | 'lifetime';
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

type BillingCase = {
  readonly id: string;
  readonly family_id: string;
  readonly user_id: string;
  readonly order_code: number | null;
  readonly case_type: 'support' | 'refund' | 'cancellation';
  readonly reason_code: 'duplicate_payment' | 'wrong_plan' | 'service_issue' | 'changed_mind' | 'other';
  readonly status: 'requested' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  readonly resolution_code: 'information_provided' | 'payment_link_cancelled' | 'manual_refund_required' | 'manual_refund_confirmed' | 'not_eligible' | 'subscription_cancelled' | null;
  readonly created_at: string;
};

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800';
const planSchema = z.enum(['free', 'trial', 'solo_monthly', 'monthly', 'yearly', 'lifetime']);
const subscriptionStatusSchema = z.enum(['active', 'inactive', 'cancelled']);

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

function subscriptionEnd(subscription: Subscription | null) {
  return subscription?.plan === 'trial'
    ? subscription.trial_ends_at
    : subscription?.subscription_ends_at;
}

function billingReasonLabel(reason: BillingCase['reason_code']) {
  return {
    duplicate_payment: 'Thanh toán trùng',
    wrong_plan: 'Chọn nhầm gói',
    service_issue: 'Vấn đề dịch vụ',
    changed_mind: 'Thay đổi nhu cầu',
    other: 'Lý do khác',
  }[reason];
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
  const [billingCases, setBillingCases] = useState<BillingCase[]>([]);
  const [caseCustomerId, setCaseCustomerId] = useState('');
  const [caseType, setCaseType] = useState<BillingCase['case_type']>('support');
  const [caseReason, setCaseReason] = useState<BillingCase['reason_code']>('service_issue');
  const [caseOrderCode, setCaseOrderCode] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);

  const requireChangeReason = () => {
    if (changeReason.trim().length >= 5) return true;
    setError('Hãy nhập lý do thao tác (ít nhất 5 ký tự) để lưu dấu vết quản trị.');
    return false;
  };

  const handleMutationError = async (response: Response, fallback: string) => {
    if (response.status === 428) {
      setMfaRequired(true);
      setError('Hãy xác minh hai bước trước khi thực hiện thao tác này.');
      return;
    }
    const body = await response.json().catch(() => null) as { error?: string } | null;
    setError(body?.error ?? fallback);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [customerResponse, couponResponse, billingCaseResponse] = await Promise.all([
      fetch('/api/admin/customers'),
      fetch('/api/admin/coupons'),
      fetch('/api/admin/billing-cases'),
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
    if (billingCaseResponse.ok) {
      const billingCaseBody = await billingCaseResponse.json() as { cases: BillingCase[] };
      setBillingCases(billingCaseBody.cases);
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
    if (!requireChangeReason()) return;
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
        reason: changeReason.trim(),
      }),
    });
    if (!response.ok) {
      await handleMutationError(response, 'Không lưu được thông tin khách hàng.');
      return;
    }
    setChangeReason('');
    setNotice(`Đã lưu hồ sơ ${customer.fullName || customer.email}.`);
  };

  const saveSubscription = async (customer: Customer) => {
    if (!customer.familyId) return;
    if (!requireChangeReason()) return;
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
        reason: changeReason.trim(),
      }),
    });
    if (!response.ok) {
      await handleMutationError(response, 'Không cập nhật được gói đăng ký.');
      return;
    }
    setChangeReason('');
    setNotice(`Đã cập nhật gói của ${customer.fullName || customer.email}.`);
    await load();
  };

  const createCoupon = async () => {
    if (!requireChangeReason()) return;
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
        reason: changeReason.trim(),
      }),
    });
    if (!response.ok) {
      await handleMutationError(response, 'Không tạo được coupon. Kiểm tra lại mã và giới hạn sử dụng.');
      return;
    }
    setCouponCode('');
    setChangeReason('');
    setNotice('Đã tạo coupon mới.');
    await load();
  };

  const createBillingCase = async () => {
    if (!requireChangeReason()) return;
    const customer = customers.find((item) => item.id === caseCustomerId);
    if (!customer?.familyId) {
      setError('Hãy chọn một khách hàng đã có gia đình.');
      return;
    }
    setError('');
    const response = await fetch('/api/admin/billing-cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: customer.id,
        familyId: customer.familyId,
        orderCode: caseOrderCode ? Number(caseOrderCode) : null,
        caseType,
        reasonCode: caseReason,
        reason: changeReason.trim(),
      }),
    });
    if (!response.ok) {
      await handleMutationError(response, 'Không tạo được hồ sơ hỗ trợ. Kiểm tra lại mã đơn hàng.');
      return;
    }
    setCaseOrderCode('');
    setChangeReason('');
    setNotice('Đã tạo hồ sơ hỗ trợ và ghi nhận lịch sử xử lý.');
    await load();
  };

  const updateBillingCase = async (billingCase: BillingCase) => {
    if (!requireChangeReason()) return;
    setError('');
    const response = await fetch('/api/admin/billing-cases', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        caseId: billingCase.id,
        status: billingCase.status,
        resolutionCode: billingCase.resolution_code,
        reason: changeReason.trim(),
      }),
    });
    if (!response.ok) {
      await handleMutationError(response, 'Không cập nhật được hồ sơ hỗ trợ.');
      return;
    }
    setChangeReason('');
    setNotice('Đã cập nhật trạng thái và lưu dấu vết xử lý.');
    await load();
  };

  const patchBillingCase = (id: string, patch: Partial<BillingCase>) => {
    setBillingCases((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</p>}
      {mfaRequired && (
        <a href="/admin/security" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
          Xác minh hai bước
        </a>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-900">
        <label className="block text-sm font-bold">Lý do thao tác quản trị
          <input
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            placeholder="Ví dụ: Tặng ưu đãi theo phiếu hỗ trợ KH-123"
            className={`${inputClass} mt-2`}
          />
        </label>
        <p className="mt-2 text-xs text-slate-600">Bắt buộc khi thay đổi hồ sơ, gói, coupon hoặc kết quả hỗ trợ. Không nhập dữ liệu riêng tư của trẻ.</p>
      </section>

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
                        <select aria-label="Gói đăng ký" value={customer.subscription?.plan ?? 'free'} disabled={!customer.familyId} onChange={(event) => updateSubscription(customer, { plan: planSchema.parse(event.target.value) })} className={`${inputClass} mt-1`}>
                          <option value="free">Chưa có gói</option>
                          <option value="trial">Dùng thử</option>
                          <option value="solo_monthly">Gói Một Bé</option>
                          <option value="monthly">Gói Gia Đình · Tháng</option>
                          <option value="yearly">Gói Gia Đình · Năm</option>
                          <option value="lifetime">Trọn đời (đã cấp trước đây)</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold">Trạng thái
                        <select aria-label="Trạng thái gói" value={customer.subscription?.status ?? 'inactive'} disabled={!customer.familyId || customer.subscription?.plan === 'free'} onChange={(event) => updateSubscription(customer, { status: subscriptionStatusSchema.parse(event.target.value) })} className={`${inputClass} mt-1`}>
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
        <h2 className="text-xl font-black">Hỗ trợ thanh toán và hoàn tiền</h2>
        <p className="mt-1 text-sm text-slate-500">Hủy link chỉ áp dụng cho đơn đang chờ. Hoàn tiền đã thanh toán phải được đối soát thủ công trước khi đánh dấu hoàn tất.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select value={caseCustomerId} onChange={(event) => setCaseCustomerId(event.target.value)} aria-label="Khách hàng cần hỗ trợ" className={inputClass}>
            <option value="">Chọn khách hàng</option>
            {customers.filter((customer) => customer.familyId).map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.fullName || customer.email}</option>
            ))}
          </select>
          <select value={caseType} onChange={(event) => setCaseType(event.target.value as BillingCase['case_type'])} aria-label="Loại yêu cầu" className={inputClass}>
            <option value="support">Hỗ trợ</option>
            <option value="refund">Hoàn tiền</option>
            <option value="cancellation">Hủy link/gói</option>
          </select>
          <select value={caseReason} onChange={(event) => setCaseReason(event.target.value as BillingCase['reason_code'])} aria-label="Lý do yêu cầu" className={inputClass}>
            <option value="service_issue">Vấn đề dịch vụ</option>
            <option value="duplicate_payment">Thanh toán trùng</option>
            <option value="wrong_plan">Chọn nhầm gói</option>
            <option value="changed_mind">Thay đổi nhu cầu</option>
            <option value="other">Khác</option>
          </select>
          <input value={caseOrderCode} onChange={(event) => setCaseOrderCode(event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Mã đơn hàng (nếu có)" aria-label="Mã đơn hàng" className={inputClass} />
        </div>
        <button type="button" onClick={() => void createBillingCase()} className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Tạo hồ sơ hỗ trợ</button>

        <div className="mt-5 space-y-3">
          {billingCases.length === 0 && <p className="text-sm text-slate-500">Chưa có hồ sơ hỗ trợ thanh toán.</p>}
          {billingCases.map((billingCase) => (
            <article key={billingCase.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-zinc-700 md:grid-cols-[minmax(0,1fr)_180px_220px_auto] md:items-end">
              <div className="min-w-0">
                <p className="text-sm font-black">{billingCase.case_type === 'refund' ? 'Hoàn tiền' : billingCase.case_type === 'cancellation' ? 'Hủy' : 'Hỗ trợ'} · {billingReasonLabel(billingCase.reason_code)}</p>
                <p className="break-all text-xs text-slate-500">Mã theo dõi: {billingCase.id}{billingCase.order_code ? ` · đơn ${billingCase.order_code}` : ''}</p>
              </div>
              <label className="text-xs font-bold">Trạng thái
                <select value={billingCase.status} onChange={(event) => patchBillingCase(billingCase.id, { status: event.target.value as BillingCase['status'] })} className={`${inputClass} mt-1`}>
                  <option value="requested">Đã tiếp nhận</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="approved">Đã chấp thuận</option>
                  <option value="rejected">Từ chối</option>
                  <option value="completed">Hoàn tất</option>
                </select>
              </label>
              <label className="text-xs font-bold">Kết quả xử lý
                <select value={billingCase.resolution_code ?? ''} onChange={(event) => patchBillingCase(billingCase.id, { resolution_code: (event.target.value || null) as BillingCase['resolution_code'] })} className={`${inputClass} mt-1`}>
                  <option value="">Chưa có</option>
                  <option value="information_provided">Đã cung cấp thông tin</option>
                  <option value="payment_link_cancelled">Đã hủy link PayOS</option>
                  <option value="manual_refund_required">Cần hoàn tiền thủ công</option>
                  <option value="manual_refund_confirmed">Đã xác nhận hoàn tiền</option>
                  <option value="not_eligible">Không đủ điều kiện</option>
                  <option value="subscription_cancelled">Đã hủy gói</option>
                </select>
              </label>
              <button type="button" onClick={() => void updateBillingCase(billingCase)} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">Lưu xử lý</button>
            </article>
          ))}
        </div>
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

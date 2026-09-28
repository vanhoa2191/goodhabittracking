import Link from 'next/link';
import { AdminAccessPanel } from '@/components/AdminAccessPanel';
import { AdminMfaPanel } from '@/components/AdminMfaPanel';
import { authorizeAdmin } from '@/lib/auth/admin-access';

export default async function AdminSecurityPage() {
  const access = await authorizeAdmin({
    roles: ['support', 'finance', 'super_admin'],
    requireAal2: false,
    allowEmergencyBootstrap: true,
  });
  if (!access.authorized) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-black">Không có quyền truy cập</h1>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Về ứng dụng</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <Link href="/admin" className="text-sm font-bold text-indigo-700">← Quay lại quản trị</Link>
          <h1 className="mt-3 text-3xl font-black">Bảo mật quản trị</h1>
          <p className="mt-2 text-sm text-slate-600">Coupon, thay đổi gói, hoàn tiền và quyền quản trị chỉ hoạt động sau bước xác minh này.</p>
        </div>
        <AdminMfaPanel />
        {access.role === 'super_admin' && <AdminAccessPanel />}
      </div>
    </main>
  );
}

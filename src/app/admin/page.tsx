import Link from 'next/link';
import { AdminCustomerManager } from '@/components/AdminCustomerManager';
import { authorizeAdmin } from '@/lib/auth/admin-access';

export default async function AdminPage() {
  const access = await authorizeAdmin({ roles: ['support', 'finance', 'super_admin'] });
  if (!access.authorized) {
    const needsMfa = access.code === 'mfa_required';
    return (
      <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 sm:p-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-black">{needsMfa ? 'Cần xác minh hai bước' : 'Không có quyền truy cập'}</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{needsMfa ? 'Hoàn tất bước bảo mật để mở dữ liệu và thao tác quản trị.' : 'Trang này chỉ dành cho thành viên quản trị đang hoạt động.'}</p>
          <Link href={needsMfa ? '/admin/security' : '/'} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">{needsMfa ? 'Xác minh ngay' : 'Về ứng dụng'}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Quản trị khách hàng</h1>
            <p className="mt-1 text-sm text-slate-500">Thành viên, đăng ký gói, coupon và chăm sóc khách hàng.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/security" className="min-h-11 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">Bảo mật quản trị</Link>
            <Link href="/" className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-900">Về ứng dụng</Link>
          </div>
        </header>
        <AdminCustomerManager />
      </div>
    </main>
  );
}

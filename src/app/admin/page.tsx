import Link from 'next/link';
import { AdminCustomerManager } from '@/components/AdminCustomerManager';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Quản trị khách hàng</h1>
            <p className="mt-1 text-sm text-slate-500">Thành viên, đăng ký gói, coupon và chăm sóc khách hàng.</p>
          </div>
          <Link href="/" className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-900">Về ứng dụng</Link>
        </header>
        <AdminCustomerManager />
      </div>
    </main>
  );
}

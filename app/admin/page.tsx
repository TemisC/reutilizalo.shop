import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats, getAdminStores } from "@/lib/data/admin";
import { AdminView } from "@/components/admin/admin-view";
import { PANEL_CONTAINER } from "@/components/panel/panel-sidebar";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <main className={PANEL_CONTAINER}>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  await requireAdmin();
  const [stats, stores] = await Promise.all([getAdminStats(), getAdminStores()]);
  return <AdminView stats={stats} stores={stores} />;
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-12 w-64 rounded-2xl bg-surface" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="h-48 rounded-3xl bg-ink/90 md:col-span-2 lg:row-span-2" />
        <div className="h-28 rounded-3xl bg-surface" />
        <div className="h-28 rounded-3xl bg-surface" />
        <div className="h-28 rounded-3xl bg-surface" />
        <div className="h-28 rounded-3xl bg-surface" />
      </div>
      <div className="h-64 rounded-3xl bg-surface" />
    </div>
  );
}

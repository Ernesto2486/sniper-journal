import { AppSidebar } from "@/components/app-sidebar";
import { requireUser } from "@/lib/data";

export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const auth = await requireUser();

  return (
    <main className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
      <AppSidebar userEmail={auth.user?.email ?? "demo@apexjournal.local"} isDemo={auth.isDemo} />
      <div className="space-y-6">
        {auth.isDemo ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            Demo mode is enabled because Supabase environment variables are missing. You can explore the full UI, charts, filters, and analytics with seed data.
          </div>
        ) : null}
        {children}
      </div>
    </main>
  );
}

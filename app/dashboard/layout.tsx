// app/dashboard/layout.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/dashboard/logout-button"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-zinc-800 bg-zinc-900 p-5 md:block">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">SolarOps</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Chico Solar Cleaners
          </p>
        </div>

        <nav className="space-y-2">
          <NavItem href="/dashboard" label="Dashboard" />
          <NavItem href="/dashboard/jobs" label="Jobs" />
          <NavItem href="/dashboard/customers" label="Customers" />
          <NavItem href="/dashboard/invoices" label="Invoices" />
          <NavItem href="/dashboard/analytics" label="Analytics" />
          <NavItem href="/dashboard/settings" label="Settings" />
          <LogoutButton />
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm font-medium">Chico Solar Cleaners</p>
            <p className="mt-1 text-xs text-zinc-500">
              Internal business dashboard
            </p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur md:px-8">
          <div>
            <h2 className="font-semibold">SolarOps</h2>
          </div>

          <Link
            href="/dashboard/jobs/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            + New Job
          </Link>
        </header>

        {/* Page */}
        <main className="px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <MobileNav href="/dashboard" label="Home" />
        <MobileNav href="/dashboard/jobs" label="Jobs" />
        <MobileNav href="/dashboard/customers" label="Customers" />
        <MobileNav href="/dashboard/settings" label="Settings" />
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
    >
      {label}
    </Link>
  );
}

function MobileNav({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center py-4 text-xs text-zinc-400 transition hover:text-white"
    >
      {label}
    </Link>
  );
}
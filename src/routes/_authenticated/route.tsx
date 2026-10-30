import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, Building2, CalendarClock, LayoutDashboard, LogOut, MessageSquareWarning, Repeat, Shield, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/halls", label: "Halls & vacancy", icon: Building2 },
  { to: "/requests", label: "Hall change / swap", icon: Repeat },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/guest-rooms", label: "Guest rooms", icon: Users },
  { to: "/bookings", label: "Hall bookings", icon: CalendarClock },
  { to: "/dues", label: "Dues", icon: Wallet },
] as const;

function Layout() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const activeCls = "bg-sidebar-accent text-sidebar-primary font-semibold";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64">
        <div className="mb-6 flex items-center gap-2 px-2">
          <BedDouble className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display text-lg font-semibold">Hall Management</span>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              <n.icon className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">{n.label}</span>
            </Link>
          ))}
          {me?.isAdmin && (
            <Link to="/admin" className={linkCls} activeProps={{ className: activeCls }}>
              <Shield className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Admin office</span>
            </Link>
          )}
        </nav>
        <div className="mt-auto hidden border-t border-sidebar-border pt-4 md:block">
          <p className="px-2 text-sm font-semibold">{me?.profile?.full_name || me?.user.email}</p>
          <p className="px-2 text-xs text-sidebar-foreground/60">{me?.isAdmin ? "Warden / Admin" : `Student · ${me?.profile?.roll_no ?? ""}`}</p>
          <button onClick={signOut} className={`${linkCls} mt-3 w-full`}><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
        <button onClick={signOut} className={`${linkCls} mt-2 md:hidden`}><LogOut className="h-4 w-4" /> Sign out</button>
      </aside>
      <main className="flex-1 px-5 py-8 md:px-10">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>
    </div>
  );
}

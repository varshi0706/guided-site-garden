import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BedDouble } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { PageHeader } from "@/components/status-badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hall Management System" }, { name: "description", content: "Your room, requests and dues at a glance." }] }),
  component: Dashboard,
});

function Stat({ label, value, to }: { label: string; value: number | string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </Link>
  );
}

function Dashboard() {
  const { data: me } = useMe();
  const { data } = useQuery({
    queryKey: ["dashboard", me?.user.id, me?.isAdmin],
    enabled: !!me,
    queryFn: async () => {
      const count = async (table: "change_requests" | "complaints" | "guest_bookings" | "hall_bookings", col: string, val: string) => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(col, val);
        return count ?? 0;
      };
      const [alloc, dues, cr, comp, guest, hb] = await Promise.all([
        supabase.from("allocations").select("rooms(room_no, room_type, halls(name))").eq("student_id", me!.user.id).eq("active", true).maybeSingle(),
        supabase.from("dues").select("*").eq("paid", false).eq(me!.isAdmin ? "paid" : "student_id", me!.isAdmin ? false : me!.user.id),
        count("change_requests", "status", "pending"),
        count("complaints", "status", "submitted"),
        count("guest_bookings", "status", "pending"),
        count("hall_bookings", "status", "pending"),
      ]);
      return { alloc: alloc.data, dues: dues.data ?? [], cr, comp, guest, hb };
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdue = (data?.dues ?? []).filter((d) => d.due_date < today);
  const room = data?.alloc?.rooms as { room_no: string; room_type: string; halls: { name: string } | null } | null | undefined;

  return (
    <div>
      <PageHeader title={`Hello, ${me?.profile?.full_name?.split(" ")[0] || "there"}`} subtitle={me?.isAdmin ? "Here's what needs attention in the hall office." : "Your hall life at a glance."} />

      {overdue.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="font-semibold">{me?.isAdmin ? `${overdue.length} overdue payment(s) across students` : `You have ${overdue.length} overdue payment(s)`}</p>
            <Link to="/dues" className="text-primary underline">View dues</Link>
          </div>
        </div>
      )}

      {!me?.isAdmin && (
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-hero p-6 text-primary-foreground shadow-card">
          <BedDouble className="h-10 w-10 text-accent" />
          {room ? (
            <div>
              <p className="text-sm opacity-80">Your room</p>
              <p className="font-display text-2xl font-semibold">{room.halls?.name} · Room {room.room_no}</p>
              <p className="text-sm capitalize opacity-80">{room.room_type} room · {me?.profile?.category}</p>
            </div>
          ) : (
            <div>
              <p className="font-display text-xl font-semibold">No room allocated yet</p>
              <p className="text-sm opacity-80">After fee payment and document check, the hall office will allocate your room.</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending change / swap" value={data?.cr ?? "–"} to="/requests" />
        <Stat label="Open complaints" value={data?.comp ?? "–"} to="/complaints" />
        <Stat label="Pending guest rooms" value={data?.guest ?? "–"} to="/guest-rooms" />
        <Stat label="Pending hall bookings" value={data?.hb ?? "–"} to="/bookings" />
      </div>
    </div>
  );
}

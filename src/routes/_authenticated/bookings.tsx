import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge, errMsg } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "Hall bookings — Hall Management System" }, { name: "description", content: "Book seminar and event halls without clashes." }] }),
  component: Bookings,
});

const t = (s: string) => s.slice(0, 5);

function Bookings() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [hallId, setHallId] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [people, setPeople] = useState("");

  const { data } = useQuery({
    queryKey: ["bookings", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [b, h] = await Promise.all([
        supabase.from("hall_bookings").select("*, profiles(full_name, roll_no), halls(name)").order("booking_date", { ascending: false }),
        supabase.from("halls").select("id, name, capacity").eq("kind", "event").eq("is_active", true).order("name"),
      ]);
      return { list: b.data ?? [], halls: h.data ?? [] };
    },
  });
  const { data: slots } = useQuery({
    queryKey: ["slots", hallId, date],
    enabled: !!hallId && !!date,
    queryFn: async () => (await supabase.rpc("booked_slots", { _hall_id: hallId, _date: date })).data ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["slots"] });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hallId) { toast.error("Choose a hall"); return; }
    const { error } = await supabase.from("hall_bookings").insert({
      user_id: me!.user.id, hall_id: hallId, booking_date: date, start_time: start, end_time: end,
      purpose, attendance: Number(people),
    });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Booking request submitted — waiting for approval");
    setPurpose("");
    refresh();
  }
  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("hall_bookings").update({ status }).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(status === "approved" ? "Booking approved" : "Booking rejected");
    refresh();
  }
  async function cancel(id: string) {
    const { error } = await supabase.from("hall_bookings").delete().eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    refresh();
  }

  const hall = data?.halls.find((h) => h.id === hallId);

  return (
    <div>
      <PageHeader title="Hall bookings" subtitle="Book auditoriums and seminar halls. Overlapping times are blocked automatically." />

      <form onSubmit={submit} className="mb-10 grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-3">
        <div>
          <Label>Hall</Label>
          <Select value={hallId} onValueChange={setHallId}>
            <SelectTrigger><SelectValue placeholder="Choose a hall" /></SelectTrigger>
            <SelectContent>{data?.halls.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} (seats {h.capacity})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="dt">Date</Label><Input id="dt" type="date" required value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></div>
        <div><Label htmlFor="pp">Expected attendance</Label><Input id="pp" type="number" min={1} max={hall?.capacity} required value={people} onChange={(e) => setPeople(e.target.value)} /></div>
        <div><Label htmlFor="st">Start time</Label><Input id="st" type="time" required value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><Label htmlFor="et">End time</Label><Input id="et" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <div className="md:col-span-3"><Label htmlFor="pu">Purpose</Label><Textarea id="pu" required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Technical club workshop" /></div>
        {hallId && date && (
          <div className="rounded-lg bg-secondary p-3 text-sm md:col-span-3">
            {slots && slots.length > 0
              ? <>Already booked that day: {slots.map((s) => `${t(s.start_time)}–${t(s.end_time)}`).join(", ")}</>
              : "This hall is free all day."}
          </div>
        )}
        <div className="md:col-span-3"><Button type="submit">Request booking</Button></div>
      </form>

      <h2 className="mb-3 text-xl font-semibold">{me?.isAdmin ? "All booking requests" : "My bookings"}</h2>
      <div className="space-y-3">
        {data?.list.length === 0 && <EmptyState text="No bookings yet." />}
        {data?.list.map((b) => {
          const p = b.profiles as { full_name: string; roll_no: string | null } | null;
          const h = b.halls as { name: string } | null;
          return (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-semibold">{h?.name} · {b.booking_date} · {t(b.start_time)}–{t(b.end_time)}</p>
                <p className="text-sm text-muted-foreground">{b.purpose} · {b.attendance} people{me?.isAdmin && p ? ` · ${p.full_name}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                {me?.isAdmin && b.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => decide(b.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(b.id, "rejected")}>Reject</Button>
                  </>
                )}
                {!me?.isAdmin && b.status === "pending" && <Button size="sm" variant="ghost" onClick={() => cancel(b.id)}>Cancel</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

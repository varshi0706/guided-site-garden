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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/guest-rooms")({
  head: () => ({ meta: [{ title: "Guest rooms — Hall Management System" }, { name: "description", content: "Request a guest room for your visitors." }] }),
  component: GuestRooms,
});

function GuestRooms() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [hallId, setHallId] = useState("");
  const [guest, setGuest] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const { data } = useQuery({
    queryKey: ["guest", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [g, h] = await Promise.all([
        supabase.from("guest_bookings").select("*, profiles(full_name, roll_no), halls(name)").order("start_date", { ascending: false }),
        supabase.from("halls").select("id, name, guest_rooms").eq("kind", "residence").gt("guest_rooms", 0).order("name"),
      ]);
      return { list: g.data ?? [], halls: h.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["guest"] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hallId) { toast.error("Choose a hall"); return; }
    const { error } = await supabase.from("guest_bookings").insert({
      student_id: me!.user.id, hall_id: hallId, guest_name: guest, start_date: start, end_date: end,
    });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Request sent to the hall manager");
    setGuest("");
    refresh();
  }
  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("guest_bookings").update({ status }).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(status === "approved" ? "Guest room approved" : "Request rejected");
    refresh();
  }

  return (
    <div>
      <PageHeader title="Guest rooms" subtitle="The hall manager approves only if a guest room is free for those dates." />
      {!me?.isAdmin && (
        <form onSubmit={submit} className="mb-10 grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-2">
          <div>
            <Label>Hall</Label>
            <Select value={hallId} onValueChange={setHallId}>
              <SelectTrigger><SelectValue placeholder="Choose a hall" /></SelectTrigger>
              <SelectContent>{data?.halls.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} ({h.guest_rooms} rooms)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="gn">Guest name</Label><Input id="gn" required value={guest} onChange={(e) => setGuest(e.target.value)} /></div>
          <div><Label htmlFor="s">Check-in</Label><Input id="s" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label htmlFor="e">Check-out</Label><Input id="e" type="date" required value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></div>
          <div className="md:col-span-2"><Button type="submit">Request guest room</Button></div>
        </form>
      )}
      <div className="space-y-3">
        {data?.list.length === 0 && <EmptyState text="No guest room requests yet." />}
        {data?.list.map((g) => {
          const p = g.profiles as { full_name: string; roll_no: string | null } | null;
          const h = g.halls as { name: string } | null;
          return (
            <div key={g.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-semibold">{g.guest_name} · {h?.name}</p>
                <p className="text-sm text-muted-foreground">{g.start_date} → {g.end_date}{me?.isAdmin && p ? ` · requested by ${p.full_name} (${p.roll_no ?? ""})` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={g.status} />
                {me?.isAdmin && g.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => decide(g.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(g.id, "rejected")}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

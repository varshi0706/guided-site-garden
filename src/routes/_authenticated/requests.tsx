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

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Hall change & swap — Hall Management System" }, { name: "description", content: "Apply for a hall change or a mutual swap." }] }),
  component: Requests,
});

function Requests() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [kind, setKind] = useState<"change" | "swap">("change");
  const [hallId, setHallId] = useState("");
  const [roll, setRoll] = useState("");
  const [reason, setReason] = useState("");
  const [roomPick, setRoomPick] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["requests", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [r, h, rooms] = await Promise.all([
        supabase.from("change_requests").select("*, profiles(full_name, roll_no, category), halls(name)").order("created_at", { ascending: false }),
        supabase.from("halls").select("id, name").eq("kind", "residence").order("name"),
        supabase.from("rooms").select("id, room_no, room_type, hall_id").order("room_no"),
      ]);
      return { list: r.data ?? [], halls: h.data ?? [], rooms: rooms.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["requests"] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "change" && !hallId) return toast.error("Choose the hall you want");
    if (kind === "swap" && !roll.trim()) return toast.error("Enter the other student's roll number");
    const { error } = await supabase.from("change_requests").insert({
      student_id: me!.user.id, kind, reason,
      desired_hall_id: kind === "change" ? hallId : null,
      swap_with_roll_no: kind === "swap" ? roll.trim() : null,
    });
    if (error) return toast.error(errMsg(error));
    toast.success("Application submitted");
    setReason(""); setRoll("");
    refresh();
  }

  async function approve(r: { id: string; kind: string }) {
    const res = r.kind === "swap"
      ? await supabase.rpc("approve_swap", { _request_id: r.id })
      : await supabase.rpc("approve_hall_change", { _request_id: r.id, _room_id: roomPick[r.id] });
    if (res.error) return toast.error(errMsg(res.error));
    toast.success("Approved and rooms updated");
    refresh();
  }
  async function reject(id: string) {
    const { error } = await supabase.from("change_requests").update({ status: "rejected" }).eq("id", id);
    if (error) return toast.error(errMsg(error));
    refresh();
  }

  return (
    <div>
      <PageHeader title="Hall change & swap" subtitle="Vacant rooms are given by seniority. Swaps need both students to agree." />

      {!me?.isAdmin && (
        <form onSubmit={submit} className="mb-10 grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-2">
          <div>
            <Label>Type of request</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "change" | "swap")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="change">Change to a vacant hall</SelectItem>
                <SelectItem value="swap">Mutual swap with another student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "change" ? (
            <div>
              <Label>Hall you want</Label>
              <Select value={hallId} onValueChange={setHallId}>
                <SelectTrigger><SelectValue placeholder="Choose a hall" /></SelectTrigger>
                <SelectContent>{data?.halls.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div><Label htmlFor="roll">Other student's roll number</Label><Input id="roll" value={roll} onChange={(e) => setRoll(e.target.value)} /></div>
          )}
          <div className="md:col-span-2"><Label htmlFor="reason">Reason</Label><Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          {kind === "swap" && <p className="text-xs text-muted-foreground md:col-span-2">After a swap, each student's pending mess bill and dues in their old hall move to the other student.</p>}
          <div className="md:col-span-2"><Button type="submit">Submit application</Button></div>
        </form>
      )}

      <div className="space-y-3">
        {data?.list.length === 0 && <EmptyState text="No applications yet." />}
        {data?.list.map((r) => {
          const p = r.profiles as { full_name: string; roll_no: string | null; category: string } | null;
          const hall = r.halls as { name: string } | null;
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-semibold">{r.kind === "swap" ? `Swap with ${r.swap_with_roll_no}` : `Change to ${hall?.name ?? "—"}`}</p>
                {me?.isAdmin && <p className="text-sm text-muted-foreground">{p?.full_name} · {p?.roll_no} · {p?.category}</p>}
                {r.reason && <p className="mt-1 text-sm">{r.reason}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                {me?.isAdmin && r.status === "pending" && (
                  <>
                    {r.kind === "change" && (
                      <Select value={roomPick[r.id] ?? ""} onValueChange={(v) => setRoomPick({ ...roomPick, [r.id]: v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Pick room" /></SelectTrigger>
                        <SelectContent>
                          {data.rooms.filter((rm) => rm.hall_id === r.desired_hall_id).map((rm) => (
                            <SelectItem key={rm.id} value={rm.id}>Room {rm.room_no} ({rm.room_type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" onClick={() => approve(r)} disabled={r.kind === "change" && !roomPick[r.id]}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
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

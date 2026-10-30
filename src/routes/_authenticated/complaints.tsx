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

export const Route = createFileRoute("/_authenticated/complaints")({
  head: () => ({ meta: [{ title: "Complaints — Hall Management System" }, { name: "description", content: "Maintenance and mess complaints." }] }),
  component: Complaints,
});

const nextLabel: Record<string, string> = {
  maintenance: "Forward to Asst. Warden (Maintenance)",
  mess: "Forward to Asst. Warden (Mess)",
};

function Complaints() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [category, setCategory] = useState<"maintenance" | "mess">("maintenance");
  const [hallId, setHallId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [filter, setFilter] = useState("all");

  const { data } = useQuery({
    queryKey: ["complaints", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [c, h] = await Promise.all([
        supabase.from("complaints").select("*, profiles(full_name, roll_no), halls(name)").order("created_at", { ascending: false }),
        supabase.from("halls").select("id, name").eq("kind", "residence").order("name"),
      ]);
      return { list: c.data ?? [], halls: h.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["complaints"] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("complaints").insert({
      student_id: me!.user.id, category, title, description: desc, hall_id: hallId || null,
    });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Complaint submitted to the hall manager");
    setTitle(""); setDesc("");
    refresh();
  }
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    refresh();
  }

  const list = (data?.list ?? []).filter((c) => filter === "all" || c.category === filter);

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Maintenance complaints go to the hall manager; mess complaints go to the General Secretary (Mess)." />

      {!me?.isAdmin && (
        <form onSubmit={submit} className="mb-10 grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-2">
          <div>
            <Label>Type</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as "maintenance" | "mess")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="mess">Mess</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Hall</Label>
            <Select value={hallId} onValueChange={setHallId}>
              <SelectTrigger><SelectValue placeholder="Choose your hall" /></SelectTrigger>
              <SelectContent>{data?.halls.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label htmlFor="t">Subject</Label><Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fan not working in room 204" /></div>
          <div className="md:col-span-2"><Label htmlFor="d">Details</Label><Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="md:col-span-2"><Button type="submit">Submit complaint</Button></div>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {["all", "maintenance", "mess"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 && <EmptyState text="No complaints here." />}
        {list.map((c) => {
          const p = c.profiles as { full_name: string; roll_no: string | null } | null;
          const h = c.halls as { name: string } | null;
          return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm capitalize text-muted-foreground">{c.category} · {h?.name ?? "—"}{me?.isAdmin && p ? ` · ${p.full_name} (${p.roll_no ?? ""})` : ""}</p>
                {c.description && <p className="mt-1 text-sm">{c.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={c.status} />
                {me?.isAdmin && c.status === "submitted" && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setStatus(c.id, "forwarded")}>{nextLabel[c.category]}</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "rejected")}>Not addressable</Button>
                  </>
                )}
                {me?.isAdmin && c.status === "forwarded" && <Button size="sm" onClick={() => setStatus(c.id, "resolved")}>Mark resolved</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { PageHeader, errMsg } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin office — Hall Management System" }, { name: "description", content: "Allocate rooms and add dues." }] }),
  component: Admin,
});

function Admin() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [student, setStudent] = useState("");
  const [room, setRoom] = useState("");
  const [dStudent, setDStudent] = useState("");
  const [desc, setDesc] = useState("Mess bill");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const [p, r, a] = await Promise.all([
        supabase.from("profiles").select("id, full_name, roll_no, category").order("full_name"),
        supabase.from("rooms").select("id, room_no, room_type, halls(name)").order("room_no"),
        supabase.from("allocations").select("id, student_id, rooms(room_no, halls(name))").eq("active", true),
      ]);
      return { students: p.data ?? [], rooms: r.data ?? [], allocs: a.data ?? [] };
    },
  });

  if (!me?.isAdmin) return <p className="text-muted-foreground">Only wardens and admins can open this page.</p>;

  async function allocate() {
    await supabase.from("allocations").update({ active: false, ended_at: new Date().toISOString() }).eq("student_id", student).eq("active", true);
    const { error } = await supabase.from("allocations").insert({ student_id: student, room_id: room });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Room allocated");
    qc.invalidateQueries();
  }
  async function addDue() {
    const { error } = await supabase.from("dues").insert({ student_id: dStudent, description: desc, amount: Number(amount), due_date: due });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Due added");
    qc.invalidateQueries();
  }

  const roomOf = (id: string) => {
    const a = data?.allocs.find((x) => x.student_id === id);
    const r = a?.rooms as { room_no: string; halls: { name: string } | null } | null | undefined;
    return r ? `${r.halls?.name} · ${r.room_no}` : "Not allocated";
  };

  return (
    <div>
      <PageHeader title="Admin office" subtitle="Allocate rooms and record dues." />
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Allocate a room</h2>
          <Select value={student} onValueChange={setStudent}><SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent>{data?.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || "(no name)"} {s.roll_no ?? ""}</SelectItem>)}</SelectContent></Select>
          <Select value={room} onValueChange={setRoom}><SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
            <SelectContent>{data?.rooms.map((r) => <SelectItem key={r.id} value={r.id}>{(r.halls as { name: string } | null)?.name} · {r.room_no} ({r.room_type})</SelectItem>)}</SelectContent></Select>
          <Button onClick={allocate} disabled={!student || !room}>Allocate</Button>
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Add a due</h2>
          <Select value={dStudent} onValueChange={setDStudent}><SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent>{data?.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || "(no name)"} {s.roll_no ?? ""}</SelectItem>)}</SelectContent></Select>
          <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          </div>
          <Button onClick={addDue} disabled={!dStudent || !amount || !due}>Add due</Button>
        </div>
      </div>
      <h2 className="mb-3 text-xl font-semibold">Student records</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Name</th><th className="p-3">Roll no</th><th className="p-3">Category</th><th className="p-3">Room</th></tr></thead>
          <tbody>{data?.students.map((s) => (
            <tr key={s.id} className="border-t"><td className="p-3">{s.full_name}</td><td className="p-3">{s.roll_no}</td><td className="p-3">{s.category}</td><td className="p-3">{roomOf(s.id)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge, errMsg } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dues")({
  head: () => ({ meta: [{ title: "Dues — Hall Management System" }, { name: "description", content: "Mess bills, hall fees and overdue alerts." }] }),
  component: Dues,
});

function Dues() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["dues", me?.user.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("dues").select("*, profiles(full_name, roll_no)").order("due_date")).data ?? [],
  });
  const today = new Date().toISOString().slice(0, 10);
  const unpaid = (data ?? []).filter((d) => !d.paid).reduce((s, d) => s + Number(d.amount), 0);

  async function markPaid(id: string) {
    const { error } = await supabase.from("dues").update({ paid: true }).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Marked as paid");
    qc.invalidateQueries({ queryKey: ["dues"] });
  }

  return (
    <div>
      <PageHeader title="Dues" subtitle={me?.isAdmin ? "All student dues. Add new dues from the Admin office." : "Pay at the hall office or through ERP. Your warden marks them paid."}>
        <div className="rounded-xl bg-hero px-5 py-3 text-primary-foreground">
          <p className="text-xs opacity-80">Total unpaid</p>
          <p className="font-display text-2xl font-semibold">₹{unpaid.toLocaleString("en-IN")}</p>
        </div>
      </PageHeader>
      <div className="space-y-3">
        {data?.length === 0 && <EmptyState text="No dues. All clear!" />}
        {data?.map((d) => {
          const p = d.profiles as { full_name: string; roll_no: string | null } | null;
          const status = d.paid ? "paid" : d.due_date < today ? "overdue" : "unpaid";
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
              <div>
                <p className="font-semibold">{d.description} · ₹{Number(d.amount).toLocaleString("en-IN")}</p>
                <p className="text-sm text-muted-foreground">Due {d.due_date}{me?.isAdmin && p ? ` · ${p.full_name} (${p.roll_no ?? ""})` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                {me?.isAdmin && !d.paid && <Button size="sm" onClick={() => markPaid(d.id)}>Mark paid</Button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

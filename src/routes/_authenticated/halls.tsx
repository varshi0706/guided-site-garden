import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/halls")({
  head: () => ({ meta: [{ title: "Halls & vacancy — Hall Management System" }, { name: "description", content: "Hall information, vacancies and staff." }] }),
  component: Halls,
});

function Halls() {
  const { data } = useQuery({
    queryKey: ["halls-info"],
    queryFn: async () => {
      const [h, v, s] = await Promise.all([
        supabase.from("halls").select("*").order("name"),
        supabase.rpc("hall_vacancy"),
        supabase.from("staff").select("*").order("name"),
      ]);
      return { halls: h.data ?? [], vac: v.data ?? [], staff: s.data ?? [] };
    },
  });

  return (
    <div>
      <PageHeader title="Halls & vacancy" subtitle="General information, free beds and staff for every hall." />
      <div className="grid gap-5 md:grid-cols-2">
        {data?.halls.map((h) => {
          const v = data.vac.find((x) => x.hall_id === h.id);
          const total = Number(v?.total_beds ?? 0);
          const used = Number(v?.occupied ?? 0);
          const staff = data.staff.filter((s) => s.hall_id === h.id);
          return (
            <div key={h.id} className="rounded-xl border bg-card p-6 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold">{h.name}</h2>
                <Badge variant="secondary">{h.kind === "event" ? "Seminar / event hall" : "Hall of residence"}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{h.location}</p>
              <p className="mt-3 text-sm">{h.description}</p>
              {h.kind === "residence" ? (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>{total - used} of {total} beds free</span><span className="text-muted-foreground">Mess ₹{h.mess_fee}/month · {h.guest_rooms} guest room(s)</span></div>
                  <Progress value={total ? (used / total) * 100 : 0} />
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium">Seats {h.capacity} people</p>
              )}
              {staff.length > 0 && (
                <ul className="mt-4 space-y-1 border-t pt-3 text-sm">
                  {staff.map((s) => (
                    <li key={s.id} className="flex justify-between gap-2">
                      <span>{s.name} <span className="text-muted-foreground">· {s.role}</span></span>
                      {s.is_recruiting ? <Badge className="bg-accent text-accent-foreground">Recruiting</Badge> : <span className="text-muted-foreground">{s.phone}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

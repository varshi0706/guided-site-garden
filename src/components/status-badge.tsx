import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  submitted: "bg-warning text-warning-foreground",
  forwarded: "bg-secondary text-secondary-foreground",
  approved: "bg-success text-success-foreground",
  resolved: "bg-success text-success-foreground",
  paid: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  overdue: "bg-destructive text-destructive-foreground",
  unpaid: "bg-warning text-warning-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`border-transparent capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </Badge>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

export function errMsg(e: unknown) {
  const m = (e as { message?: string })?.message ?? "Something went wrong";
  return m;
}

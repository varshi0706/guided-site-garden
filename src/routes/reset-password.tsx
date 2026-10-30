import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Hall Management System" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Reset password — Hall Management System" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <div><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </div>
  );
}

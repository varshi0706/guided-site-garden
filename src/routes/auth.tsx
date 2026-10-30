import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Hall Management System" },
      { name: "description", content: "Sign in or create your student account." },
      { property: "og:title", content: "Sign in — Hall Management System" },
      { property: "og:description", content: "Sign in or create your student account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [category, setCategory] = useState("BTech");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: f.get("full_name"), roll_no: f.get("roll_no"), category },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCheckEmail(true);
  }

  async function forgot() {
    const email = (document.getElementById("si-email") as HTMLInputElement)?.value;
    if (!email) { toast.error("Type your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent to your email");
  }

  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { toast.error(String(result.error.message ?? result.error)); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <h1 className="text-3xl font-semibold">Hall Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Students, wardens and hall managers sign in here.</p>

        {checkEmail ? (
          <div className="mt-8 rounded-lg bg-secondary p-5 text-sm">
            Check your email and click the confirmation link to finish creating your account.
          </div>
        ) : (
          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <div><Label htmlFor="si-email">Email</Label><Input id="si-email" name="email" type="email" required /></div>
                <div><Label htmlFor="si-pw">Password</Label><Input id="si-pw" name="password" type="password" required /></div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
                <button type="button" onClick={forgot} className="text-sm text-primary underline-offset-4 hover:underline">Forgot password?</button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <div><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="full_name" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="su-roll">Roll number</Label><Input id="su-roll" name="roll_no" placeholder="23BCE7060" /></div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["BTech", "MTech", "MS", "PhD", "Staff"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required /></div>
                <div><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" minLength={6} required /></div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => social("google")}>Continue with Google</Button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continue with Lovable</button>
        </div>
      </div>
    </div>
  );
}

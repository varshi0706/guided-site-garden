import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, CalendarClock, MessageSquareWarning, Repeat, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hall Management System — Rooms, Complaints & Bookings" },
      { name: "description", content: "One place for room allocation, hall change and swaps, complaints, guest rooms, dues and seminar hall bookings." },
      { property: "og:title", content: "Hall Management System" },
      { property: "og:description", content: "Room allocation, complaints, guest rooms, dues and hall bookings in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: BedDouble, title: "Room allocation", text: "Students get a single or sharing room based on their category." },
  { icon: Repeat, title: "Hall change & swap", text: "Apply for a vacant hall or swap with a consenting student." },
  { icon: MessageSquareWarning, title: "Complaints", text: "Raise maintenance and mess complaints and track them." },
  { icon: Users, title: "Guest rooms", text: "Request a guest room for your visitors' dates." },
  { icon: CalendarClock, title: "Hall bookings", text: "Book seminar halls; double bookings are blocked automatically." },
  { icon: Wallet, title: "Dues & alerts", text: "See mess bills and fees, with alerts for overdue payments." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl font-semibold text-primary-foreground">HMS</span>
          <Button asChild variant="secondary"><Link to="/auth">Sign in</Link></Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src={hero} alt="Hall of residence on campus" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero opacity-80" />
        <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-40">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Hall Management System</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight text-primary-foreground md:text-6xl">
            Campus living, run without the paperwork.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
            Rooms, complaints, guest rooms, dues and hall bookings for students, wardens and hall managers.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold">Everything the hall office handles</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Hall Management System · Software Project Management mini-project
      </footer>
    </div>
  );
}

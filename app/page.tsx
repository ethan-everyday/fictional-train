import Link from "next/link";
import { LOCATIONS, NIGHT_COUNT } from "@/lib/game/constants";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* Lantern glow rising from the bottom of the screen. */}
      <div
        aria-hidden
        className="lantern pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_120%,rgba(245,158,11,0.14),transparent_65%)]"
      />

      <div className="relative flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-12 px-6 py-16 text-center">
        <header className="fade-up">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.4em] text-amber-400/90">
            A party game of small-town secrets
          </p>
          <h1 className="text-7xl font-black leading-none tracking-tight sm:text-8xl">
            SEVEN
            <br />
            NIGHTS
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            The village of Hollowbrook has {NIGHT_COUNT} nights,{" "}
            {LOCATIONS.length} places to spend them, and more secrets than it
            will admit to. The big screen tells the story. Your phones decide
            how it goes.
          </p>
        </header>

        <div className="fade-up fade-up-1 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/host"
            className="rounded-xl bg-amber-500 px-10 py-5 text-center text-xl font-black text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400"
          >
            HOST on this screen
          </Link>
          <Link
            href="/play"
            className="rounded-xl border-2 border-zinc-700 px-10 py-5 text-center text-xl font-black hover:border-amber-500/60"
          >
            JOIN on this phone
          </Link>
        </div>

        <section className="fade-up fade-up-2 grid w-full gap-4 sm:grid-cols-3">
          <Step
            n={1}
            title="Choose"
            text="Each night, pick where in Hollowbrook to spend it — the tavern, the church, the woods…"
          />
          <Step
            n={2}
            title="Live it"
            text="Your phone deals you a private storylet. What you did out there is your business."
          />
          <Step
            n={3}
            title="Face the morning"
            text="The big screen tells everyone what the night did to each of you. Seven nights decide the ending."
          />
        </section>

        <footer className="fade-up fade-up-3 text-sm text-zinc-600">
          2–6 players · one TV or laptop · phones stay private ·{" "}
          {NIGHT_COUNT} nights, three endings
        </footer>
      </div>
    </main>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-left">
      <p className="font-mono text-sm font-bold text-amber-400">
        NIGHTFALL · {n}
      </p>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

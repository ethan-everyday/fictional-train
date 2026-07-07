import Link from "next/link";
import MusicToggle from "@/components/MusicToggle";
import { Rule } from "@/components/Ornament";
import { LOCATIONS, NIGHT_COUNT } from "@/lib/game/constants";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* The village woodcut: full-bleed hero that fades into the dark page. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[58vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/village-woodcut.jpg"
          alt=""
          className="h-full w-full object-cover object-center sepia-[.35] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/55 via-night/35 to-night" />
      </div>
      {/* Lantern glow rising from the bottom of the screen. */}
      <div
        aria-hidden
        className="lantern pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_120%,rgba(245,158,11,0.14),transparent_65%)]"
      />

      <div className="relative flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-12 px-6 pb-16 pt-[28vh] text-center">
        <header className="fade-up flex flex-col items-center">
          <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.4em] text-amber-300 [text-shadow:0_1px_8px_rgba(9,9,11,0.9)] sm:text-sm">
            A party game of village fortunes
          </p>
          <Rule className="mb-4 w-64 max-w-full" />
          <h1 className="font-display text-7xl font-bold leading-[0.95] text-parch-100 [text-shadow:0_2px_24px_rgba(9,9,11,0.95)] sm:text-8xl">
            SEVEN
            <br />
            NIGHTS
          </h1>
          <Rule className="mt-5 w-64 max-w-full" />
          <p className="font-prose mx-auto mt-5 max-w-xl text-lg leading-relaxed text-parch-300 [text-shadow:0_1px_12px_rgba(9,9,11,0.9)] sm:text-xl">
            Seven nights before the Michaelmas Fair, when the lord reckons all
            accounts. {LOCATIONS.length} places to spend them, a village full
            of people to win over — or cross. The big screen tells the story.
            Your phones decide how it goes.
          </p>
        </header>

        <div className="fade-up fade-up-1 flex flex-col items-center gap-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/host" className="btn-quest px-10 py-5 text-lg">
              HOST on this screen
            </Link>
            <Link href="/play" className="btn-parch px-10 py-5 text-lg">
              JOIN on this phone
            </Link>
          </div>
          <MusicToggle />
        </div>

        <section className="fade-up fade-up-2 grid w-full gap-4 sm:grid-cols-3">
          <Step
            n={1}
            title="Choose"
            text="Each night, pick where in Hollowbrook to spend it — the tavern, the castle, the docks…"
          />
          <Step
            n={2}
            title="Live it"
            text="Your phone deals you a private storylet: the innkeep, the gamblers, the lord, the foreign traders. What you did out there is your business."
          />
          <Step
            n={3}
            title="Face the morning"
            text="The big screen tells everyone what the night did to each of you. Seven nights decide how fair day goes."
          />
        </section>

        <footer className="fade-up fade-up-3 font-display text-xs uppercase tracking-[0.25em] text-parch-600">
          2–6 players · one TV or laptop · phones stay private ·{" "}
          {NIGHT_COUNT} nights, three endings
        </footer>
      </div>
    </main>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-bark/80 bg-oak/40 p-6 text-center backdrop-blur-sm">
      <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
        NIGHTFALL · {n}
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-parch-100">
        {title}
      </h2>
      <p className="font-prose mt-2 text-sm leading-relaxed text-parch-400">
        {text}
      </p>
    </div>
  );
}

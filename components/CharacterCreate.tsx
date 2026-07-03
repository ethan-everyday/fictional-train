"use client";

import { useState } from "react";
import { baseStats, BACKGROUNDS, ROLES } from "@/lib/game/character";
import { STAT_SHORT } from "@/lib/game/constants";
import type { BackgroundId, Character, RoleId, StatId } from "@/lib/game/types";

interface Props {
  initial?: Character | null;
  onConfirm: (character: Character) => void;
}

/**
 * Phone character creation, shown in the lobby before the week begins:
 * pick a role and a background, see the resulting stats, lock it in.
 */
export default function CharacterCreate({ initial, onConfirm }: Props) {
  const [role, setRole] = useState<RoleId | null>(initial?.role ?? null);
  const [background, setBackground] = useState<BackgroundId | null>(
    initial?.background ?? null,
  );

  const ready = role !== null && background !== null;
  const preview = ready ? baseStats({ role, background }) : null;

  return (
    <main className="flex min-h-screen flex-col gap-6 p-5">
      <h1 className="text-center text-3xl font-black tracking-tight">
        Who are you?
      </h1>

      <Section title="Your calling">
        {ROLES.map((r) => (
          <PickCard
            key={r.id}
            selected={role === r.id}
            name={r.name}
            blurb={r.blurb}
            onClick={() => setRole(r.id)}
          />
        ))}
      </Section>

      <Section title="Your past">
        {BACKGROUNDS.map((b) => (
          <PickCard
            key={b.id}
            selected={background === b.id}
            name={b.name}
            blurb={b.blurb}
            onClick={() => setBackground(b.id)}
          />
        ))}
      </Section>

      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bark bg-night/95 px-5 pb-5 pt-4 backdrop-blur">
        {preview && (
          <div className="mb-3 flex justify-center gap-3 text-xs">
            {(Object.keys(STAT_SHORT) as StatId[]).map((s) => (
              <span key={s} className="text-center">
                <span className="block font-mono font-bold text-parch-100">
                  {preview[s]}
                </span>
                <span className={s === "wealth" ? "text-amber-400" : "text-parch-500"}>
                  {STAT_SHORT[s]}
                </span>
              </span>
            ))}
          </div>
        )}
        <button
          disabled={!ready}
          onClick={() => ready && onConfirm({ role, background })}
          className="font-display w-full rounded-xl bg-amber-500 px-6 py-4 text-xl text-night disabled:opacity-40"
        >
          {ready ? "Enter St Sebastian" : "Choose a calling and a past"}
        </button>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-400">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function PickCard({
  selected,
  name,
  blurb,
  onClick,
}: {
  selected: boolean;
  name: string;
  blurb: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-amber-400 bg-amber-500/10"
          : "border-bark-light bg-oak active:bg-bark"
      }`}
    >
      <span className="block font-semibold text-parch-100">{name}</span>
      <span className="block text-sm text-parch-400">{blurb}</span>
    </button>
  );
}

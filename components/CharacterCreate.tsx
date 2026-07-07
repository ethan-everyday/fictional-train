"use client";

import { useState } from "react";
import { Art } from "@/components/Art";
import { ChronicleHeading } from "@/components/Ornament";
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
 * Styled as the first page of the player's journal.
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
      <div className="flex flex-col gap-2 pt-1">
        <ChronicleHeading>St Sebastian</ChronicleHeading>
        <h1 className="font-display text-center text-3xl font-black tracking-tight text-parch-100">
          Who are you?
        </h1>
      </div>

      <Section title="Your calling">
        {ROLES.map((r) => (
          <PickCard
            key={r.id}
            selected={role === r.id}
            name={r.name}
            blurb={r.blurb}
            img={`/images/roles/${r.id}.png`}
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
          <div className="mb-3 flex justify-center">
            {/* The inked ledger strip: where the week will begin. */}
            <div className="flex divide-x divide-bark/60 rounded-md border border-bark bg-oak/60 px-1 py-1.5 shadow-inner shadow-black/30">
              {(Object.keys(STAT_SHORT) as StatId[]).map((s) => (
                <span key={s} className="px-2.5 text-center">
                  <span className="font-display block text-sm font-semibold leading-tight text-parch-100">
                    {preview[s]}
                  </span>
                  <span
                    className={`block text-[9px] uppercase tracking-[0.18em] ${
                      s === "wealth" ? "text-amber-400" : "text-parch-500"
                    }`}
                  >
                    {STAT_SHORT[s]}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          disabled={!ready}
          onClick={() => ready && onConfirm({ role, background })}
          className="btn-quest w-full py-4 text-base disabled:opacity-40"
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
      <h2 className="font-display mb-2.5 text-center text-xs font-bold uppercase tracking-[0.3em] text-amber-400/90">
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
  img,
  onClick,
}: {
  selected: boolean;
  name: string;
  blurb: string;
  /** Woodcut portrait (roles only); missing art collapses to text-only. */
  img?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        selected
          ? "border-gold bg-parch-100/10 ring-1 ring-gold/60 ring-offset-2 ring-offset-night"
          : "border-bark-light bg-oak active:bg-bark"
      }`}
    >
      {img && (
        <Art
          src={img}
          className={`h-14 w-14 shrink-0 rounded-lg border object-cover object-top sepia-[.15] ${
            selected ? "border-gold/60" : "border-bark/70"
          }`}
        />
      )}
      <span className="min-w-0">
        <span className="font-display block tracking-wide text-parch-100">
          {name}
        </span>
        <span className="font-prose block text-sm italic leading-snug text-parch-400">
          {blurb}
        </span>
      </span>
    </button>
  );
}

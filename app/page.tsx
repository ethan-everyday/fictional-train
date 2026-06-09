import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight">SEVEN NIGHTS</h1>
        <p className="mt-2 text-zinc-400">prototype · milestone 1: plumbing</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/host"
          className="rounded-xl bg-amber-500 px-8 py-4 text-center text-xl font-bold text-zinc-950 hover:bg-amber-400"
        >
          Host on this screen
        </Link>
        <Link
          href="/play"
          className="rounded-xl border-2 border-zinc-700 px-8 py-4 text-center text-xl font-bold hover:border-zinc-500"
        >
          Join on this phone
        </Link>
      </div>
      <p className="max-w-md text-center text-sm text-zinc-500">
        Open <span className="font-mono">/host</span> on the TV or laptop,
        then point phones at the QR code it shows.
      </p>
    </main>
  );
}

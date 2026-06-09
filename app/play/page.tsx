"use client";

import dynamic from "next/dynamic";

// playroomkit touches browser globals at import time; never render on the server.
const PlayScreen = dynamic(() => import("@/components/PlayScreen"), {
  ssr: false,
});

export default function PlayPage() {
  return <PlayScreen />;
}

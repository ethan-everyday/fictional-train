"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

// playroomkit touches browser globals at import time; never render on the server.
const PlayScreen = dynamic(() => import("@/components/PlayScreen"), {
  ssr: false,
});

export default function PlayPage() {
  return (
    <ErrorBoundary>
      <PlayScreen />
    </ErrorBoundary>
  );
}

"use client";

import dynamic from "next/dynamic";

// playroomkit touches browser globals at import time; never render on the server.
const HostScreen = dynamic(() => import("@/components/HostScreen"), {
  ssr: false,
});

export default function HostPage() {
  return <HostScreen />;
}

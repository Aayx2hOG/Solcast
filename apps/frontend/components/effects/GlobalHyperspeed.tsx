"use client";

import dynamic from "next/dynamic";

const Hyperspeed = dynamic(() => import("@/components/effects/Hyperspeed"), {
  ssr: false,
});

export function GlobalHyperspeed() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-50"
      style={{ 
        zIndex: 0,
        mixBlendMode: 'screen'
      }}
    >
      <Hyperspeed />
    </div>
  );
}

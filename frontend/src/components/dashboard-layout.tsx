"use client";

import { FlickeringGrid } from "@/components/ui/flickering-grid";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-mono"
      style={{ backgroundColor: "#E0E7FF" }}
    >
      <FlickeringGrid
        className="absolute inset-0 z-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#60A5FA"
        maxOpacity={0.3}
        flickerChance={0.1}
      />
      <div className="relative z-10 mx-auto max-w-7xl p-6">
        {children}
      </div>
    </div>
  );
}

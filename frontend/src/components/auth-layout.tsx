"use client";

import { FlickeringGrid } from "@/components/ui/flickering-grid";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden font-mono"
      style={{ backgroundColor: "#E0E7FF" }}
    >
      <FlickeringGrid
        className="absolute inset-0 z-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#60A5FA"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

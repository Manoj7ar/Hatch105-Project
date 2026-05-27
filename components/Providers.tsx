"use client";

import { CompareProvider } from "@/lib/compare-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CompareProvider>{children}</CompareProvider>;
}

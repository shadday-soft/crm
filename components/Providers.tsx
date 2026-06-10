"use client";

import type { ReactNode } from "react";
import { ApiCounterProvider } from "@/lib/api-counter";
import { ConfigProvider } from "@/lib/config-context";
import { UIProvider } from "@/lib/ui-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiCounterProvider>
      <ConfigProvider>
        <UIProvider>{children}</UIProvider>
      </ConfigProvider>
    </ApiCounterProvider>
  );
}

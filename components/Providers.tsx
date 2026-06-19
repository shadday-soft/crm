"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ApiCounterProvider } from "@/lib/api-counter";
import { ConfigProvider } from "@/lib/config-context";
import { UIProvider } from "@/lib/ui-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ApiCounterProvider>
        <ConfigProvider>
          <UIProvider>{children}</UIProvider>
        </ConfigProvider>
      </ApiCounterProvider>
    </SessionProvider>
  );
}

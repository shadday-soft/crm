// Wrapper centralizado sobre Sileo para los toasts de toda la app.
// Posición por defecto (top-center) y tema se configuran en <Toaster> (AppShell).
// Solo se debe importar desde componentes cliente.
import { sileo } from "sileo";

type Opts = { description?: string; duration?: number };

export const toast = {
  success: (title: string, opts?: Opts) => sileo.success({ title, ...opts }),
  error: (title: string, opts?: Opts) => sileo.error({ title, ...opts }),
  info: (title: string, opts?: Opts) => sileo.info({ title, ...opts }),
  warning: (title: string, opts?: Opts) => sileo.warning({ title, ...opts }),
};

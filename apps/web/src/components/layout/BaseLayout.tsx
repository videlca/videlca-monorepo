import type { ReactNode } from "react";

export const BaseLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen">{children}</div>
);

import React from "react";
import type { ReactNode } from "react";

interface BaseLayoutProps {
  children: ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
};

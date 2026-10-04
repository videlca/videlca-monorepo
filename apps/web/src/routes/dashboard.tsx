import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "../components/layout/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context }: any) => {
    if (!context?.auth?.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  notFoundComponent: () => {
    throw redirect({ to: "/" });
  },
});

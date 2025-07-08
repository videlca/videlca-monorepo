import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "../components/layout/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  beforeLoad: async ({ context }: any) => {
    // If user is not authenticated, redirect to login
    if (!context?.auth?.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
});

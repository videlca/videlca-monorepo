import Box from "@mui/material/Box";
import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "../ui/dashboard/Header";
import { MainContent } from "../ui/dashboard/MainContent";
import { Sidebar } from "../ui/dashboard/Sidebar";
import { useLogout } from "../../api/queryFunctions/auth";

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();
  // Abrir de entrada el grupo del menú de la ruta actual (/dashboard/<modulo>/...)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() =>
    pathname.split("/").slice(2, 3).filter(Boolean),
  );
  const logoutMutation = useLogout();

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  return (
    <Box
      sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        expandedMenus={expandedMenus}
        onMenuToggle={toggleMenu}
        onLogout={() => logoutMutation.mutate()}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        <Header />
        <MainContent />
      </div>
    </Box>
  );
}

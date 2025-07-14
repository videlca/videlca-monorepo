import { useState } from "react";
import { Header } from "../ui/dashboard/Header";
import { MainContent } from "../ui/dashboard/MainContent";
import { Sidebar } from "../ui/dashboard/Sidebar";
import { useLogout } from "../../api/queryFunctions/auth";

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const logoutMutation = useLogout();

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const onLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        expandedMenus={expandedMenus}
        onMenuToggle={toggleMenu}
        onLogout={onLogout}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <MainContent />
      </div>
    </div>
  );
}

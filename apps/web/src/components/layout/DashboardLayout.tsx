import { useState } from "react";
import { Header } from "../ui/dashboard/Header";
import { MainContent } from "../ui/dashboard/MainContent";
import { Sidebar } from "../ui/dashboard/Sidebar";
import { useNavigate } from "@tanstack/react-router";

export function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const onLogout = () => {
    navigate({
      to: "/",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
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

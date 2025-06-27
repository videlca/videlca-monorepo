import { useLocation } from "@tanstack/react-router";
import { User } from "lucide-react";
import { linksSideBar } from "../../../LinkPages";

export function Header() {
  const { pathname } = useLocation();
  const module = pathname.split("/")[2];
  const pageTitle =
    linksSideBar[module as keyof typeof linksSideBar]?.find(
      (link) => link.to === pathname,
    )?.label || "Dashboard";

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-600">Admin</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}

import { Outlet, useLocation } from "@tanstack/react-router";
import { linksSideBar } from "../../../LinkPages";

export function MainContent() {
  const { pathname } = useLocation();
  const module = pathname.split("/")[2];
  const pageTitle =
    linksSideBar[module as keyof typeof linksSideBar]?.find(
      (link) => link.to === pathname,
    )?.label || "";
  return (
    <main className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 flex-1 overflow-y-auto">
      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-2 pb-8 md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold text-gray-900">
            {
              linksSideBar[module as keyof typeof linksSideBar]?.find(
                (link) => link.to === pathname,
              )?.icon
            }
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {pageTitle}
          </div>
        </div>
        <Outlet />
      </div>
    </main>
  );
}

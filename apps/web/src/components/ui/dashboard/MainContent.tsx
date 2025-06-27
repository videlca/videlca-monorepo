import { Outlet } from "@tanstack/react-router";

export function MainContent() {
  return (
    <main className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 flex-1 overflow-y-auto">
      <div className="mx-auto mt-8 max-w-7xl px-2 md:px-6 lg:px-8">
        <Outlet />
      </div>
    </main>
  );
}

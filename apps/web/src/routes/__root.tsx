import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="flex h-full w-full items-center justify-center bg-blue-400">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-lg bg-white p-8">
        <h1 className="mb-2 text-center text-2xl font-medium text-gray-700">
          404
        </h1>
        <p className="text-sm font-light text-gray-500">
          La página que buscas no existe.
        </p>
        <Link to="/" className="text-blue-400">
          Regresar al inicio
        </Link>
      </div>
    </div>
  ),
});

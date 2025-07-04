import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Bienvenido al sistema</h1>
      <p className="text-gray-600">
        Aquí podrás gestionar los usuarios, clientes, ordenes de servicio,
        reportes, etc.
      </p>
    </div>
  );
}

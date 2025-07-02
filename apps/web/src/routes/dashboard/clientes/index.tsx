import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useState } from "react";
import Table from "../../../components/common/Table";

export const Route = createFileRoute("/dashboard/clientes/")({
  component: RouteComponent,
});

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

function RouteComponent() {
  const [selectedRow, setSelectedRow] = useState<Row<User> | null>(null);
  const dataUsers: User[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "active",
      createdAt: "2024-01-16",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Manager",
      status: "inactive",
      createdAt: "2024-01-17",
    },
  ];

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-blue-600">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {row.getValue("role")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span>{new Date(row.getValue("createdAt")).toLocaleDateString()}</span>
      ),
    },
    {
      id: "select-col",
      header: "Acciones",
      cell: ({ row }) => (
        <button
          className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          onClick={() => setSelectedRow(row)}
        >
          <PencilIcon className="h-4 w-4" />
          Editar
        </button>
      ),
    },
  ];
  return (
    <Section>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Nuevo cliente"
            onClick={() => {
              console.log(selectedRow?.original);
            }}
          />
        </div>
        <Table
          data={dataUsers}
          columns={columns}
          enableSorting={true}
          enablePagination={true}
          pageSize={10}
        />
        <pre>{JSON.stringify(selectedRow?.original, null, 2)}</pre>
      </div>
    </Section>
  );
}

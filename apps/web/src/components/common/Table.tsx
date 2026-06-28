import { useState, useRef, useCallback } from "react";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  X,
  Loader2,
} from "lucide-react";

export interface ServerFilterColumn {
  label: string;
  value: string;
}

interface TableProps<TData, TValues> {
  data: TData[];
  columns: ColumnDef<TData, TValues>[];
  className?: string;
  enableSorting?: boolean;
  enablePagination?: boolean;
  enableFiltering?: boolean;
  pageSize?: number;
  showHeader?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  /** Custom filterable columns for server-side filtering */
  filterColumns?: ServerFilterColumn[];
  /** Callback triggered when a server-side filter is applied */
  onServerFilter?: (column: string, query: string) => void;
  /** Callback triggered when the server-side filter is cleared */
  onServerFilterClear?: () => void;
  /** Whether the server filter request is in progress */
  serverFilterLoading?: boolean;
}

const Table = <TData, TValues>({
  data,
  columns,
  className = "",
  enableSorting = true,
  enablePagination = true,
  enableFiltering = false,
  pageSize = 5,
  showHeader = true,
  loading = false,
  emptyMessage = "No data available",
  pageSizeOptions = [2, 5, 10, 15, 20],
  filterColumns,
  onServerFilter,
  onServerFilterClear,
  serverFilterLoading = false,
}: TableProps<TData, TValues>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isServerFiltering = !!onServerFilter;

  const debouncedServerFilter = useCallback(
    (column: string, query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onServerFilter?.(column, query);
      }, 400);
    },
    [onServerFilter],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    enableSorting,
    manualPagination: !enablePagination,
    enableColumnFilters: enableFiltering,
    enableMultiRowSelection: false,
  });

  const getSortIcon = (isSorted: false | "asc" | "desc") => {
    if (isSorted === "asc") return <ChevronUp className="h-4 w-4" />;
    if (isSorted === "desc") return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    if (isServerFiltering) {
      if (selectedFilterColumn && value) {
        debouncedServerFilter(selectedFilterColumn, value);
      } else if (!value && onServerFilterClear) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        onServerFilterClear();
      }
    } else {
      if (selectedFilterColumn && value) {
        table.getColumn(selectedFilterColumn)?.setFilterValue(value);
      } else {
        table.resetColumnFilters();
      }
    }
  };

  const handleColumnChange = (newColumn: string) => {
    setSelectedFilterColumn(newColumn);
    if (filterValue && newColumn) {
      if (isServerFiltering) {
        debouncedServerFilter(newColumn, filterValue);
      } else {
        table.resetColumnFilters();
        table.getColumn(newColumn)?.setFilterValue(filterValue);
      }
    } else if (!newColumn) {
      setFilterValue("");
      if (isServerFiltering && onServerFilterClear) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        onServerFilterClear();
      } else {
        table.resetColumnFilters();
      }
    }
  };

  const clearFilter = () => {
    setFilterValue("");
    setSelectedFilterColumn("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (isServerFiltering && onServerFilterClear) {
      onServerFilterClear();
    } else {
      table.resetColumnFilters();
    }
  };

  const filterableColumns = columns.filter(
    (column) =>
      "accessorKey" in column &&
      column.accessorKey &&
      typeof column.accessorKey === "string",
  );

  // Use custom filterColumns if provided, otherwise derive from column defs
  const displayFilterColumns: ServerFilterColumn[] = filterColumns
    ? filterColumns
    : filterableColumns.map((col) => ({
        label:
          typeof col.header === "string"
            ? col.header
            : ((col as any).accessorKey as string),
        value: (col as any).accessorKey as string,
      }));

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const showFilterBar = enableFiltering && displayFilterColumns.length > 0;

  return (
    <div className={`w-full ${className} relative`}>
      {showFilterBar && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Filtrar por:
            </span>
          </div>

          <select
            value={selectedFilterColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Seleccionar columna</option>
            {displayFilterColumns.map((col) => (
              <option key={col.value} value={col.value}>
                {col.label}
              </option>
            ))}
          </select>

          <div className="relative max-w-md flex-1">
            <input
              type="text"
              value={filterValue}
              onChange={(e) => handleFilterChange(e.target.value)}
              placeholder={
                selectedFilterColumn
                  ? `Filtrar ${displayFilterColumns.find((c) => c.value === selectedFilterColumn)?.label ?? selectedFilterColumn}...`
                  : "Seleccionar una columna primero"
              }
              disabled={!selectedFilterColumn}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            {filterValue && (
              <button
                onClick={clearFilter}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {serverFilterLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buscando...</span>
            </div>
          )}

          {filterValue && !serverFilterLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filtrando:</span>
              <span className="font-medium">
                {displayFilterColumns.find((c) => c.value === selectedFilterColumn)?.label ?? selectedFilterColumn}
              </span>
              <span>=</span>
              <span className="font-medium">"{filterValue}"</span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="relative w-full">
          {showHeader && (
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase ${header.column.getCanSort() && enableSorting
                        ? "cursor-pointer select-none hover:bg-gray-100"
                        : ""
                        }`}
                      onClick={
                        header.column.getCanSort() && enableSorting
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && enableSorting && (
                          <span className="text-gray-400">
                            {getSortIcon(header.column.getIsSorted())}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="text-center transition-colors hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`w-fit px-6 py-4 text-center text-sm break-words ${cell.column.id === "actions"
                        ? "relative overflow-visible"
                        : ""
                        }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {enablePagination && (
        <div className="flex items-center justify-between rounded-b-lg border border-gray-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>
              Mostrando{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}{" "}
              de {table.getFilteredRowModel().rows.length} resultados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={0} disabled>
                Seleccionar
              </option>
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;

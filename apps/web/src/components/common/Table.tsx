import { Fragment, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ExpandedState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export interface ServerFilterColumn {
  label: string;
  value: string;
}

interface TableProps<TData, TValues> {
  data: TData[];
  columns: ColumnDef<TData, TValues>[];
  className?: string;
  enableSorting?: boolean;
  /**
   * Datos/callbacks que las celdas leen en tiempo de render via context.table.options.meta, en vez de
   * capturarlos por closure en `columns`. Permite que `columns` (y por lo tanto sus funciones `cell`)
   * se mantengan memoizadas/estables aunque estos valores cambien en cada tecla: si `cell` cambiara de
   * referencia en cada render, React la trata como un componente distinto (ver flexRender) y remonta el
   * contenido de la celda, perdiendo el foco de cualquier input editable dentro de ella.
   */
  meta?: object;
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
  /** Server-side pagination: enables manual pagination controlled by the parent */
  serverPagination?: boolean;
  /** Server-side pagination: total number of rows in the backend */
  totalRows?: number;
  /** Server-side pagination: current page index (0-based) */
  currentPage?: number;
  /** Server-side pagination: callback when page changes */
  onPageChange?: (page: number) => void;
  /** Server-side pagination: callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /**
   * Contenido de la fila desplegable bajo cada fila. Si se define, las celdas pueden alternarla con
   * row.toggleExpanded() / leer su estado con row.getIsExpanded()
   */
  renderExpandedRow?: (row: TData) => ReactNode;
  /**
   * Id estable por fila. Recomendado junto con renderExpandedRow en paginacion por servidor: por defecto el id es
   * el indice, y al cambiar de pagina las filas nuevas heredarian el estado desplegado de las anteriores
   */
  getRowId?: (row: TData) => string;
}

const Table = <TData, TValues>({
  data,
  columns,
  className = "",
  enableSorting = true,
  meta,
  enablePagination = true,
  enableFiltering = false,
  pageSize = 5,
  showHeader = true,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  pageSizeOptions = [2, 5, 10, 15, 20],
  filterColumns,
  onServerFilter,
  onServerFilterClear,
  serverFilterLoading = false,
  serverPagination = false,
  totalRows = 0,
  currentPage = 0,
  onPageChange,
  onPageSizeChange,
  renderExpandedRow,
  getRowId,
}: TableProps<TData, TValues>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
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

  const serverPageCount = serverPagination
    ? Math.ceil(totalRows / pageSize)
    : undefined;

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: serverPagination
      ? undefined
      : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => !!renderExpandedRow,
    getRowId,
    state: {
      expanded,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      ...(serverPagination
        ? { pagination: { pageIndex: currentPage, pageSize } }
        : {}),
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    enableSorting,
    manualPagination: serverPagination || !enablePagination,
    ...(serverPagination ? { pageCount: serverPageCount } : {}),
    enableColumnFilters: enableFiltering,
    enableMultiRowSelection: false,
  });

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
      <Paper
        variant="outlined"
        className={`flex w-full items-center justify-center gap-2 p-8 ${className}`}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary">Cargando...</Typography>
      </Paper>
    );
  }

  const showFilterBar = enableFiltering && displayFilterColumns.length > 0;
  const selectedFilterLabel =
    displayFilterColumns.find((c) => c.value === selectedFilterColumn)?.label ??
    selectedFilterColumn;
  const { pageIndex, pageSize: clientPageSize } = table.getState().pagination;

  return (
    <div className={`relative w-full ${className}`}>
      {showFilterBar && (
        <Paper
          variant="outlined"
          className="mb-4 flex flex-wrap items-center gap-4 p-4"
        >
          <TextField
            select
            label="Filtrar por"
            value={selectedFilterColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            fullWidth={false}
            sx={{ minWidth: 200 }}
            slotProps={{
              inputLabel: { shrink: true },
              select: { displayEmpty: true },
            }}
          >
            <MenuItem value="">Seleccionar columna</MenuItem>
            {displayFilterColumns.map((col) => (
              <MenuItem key={col.value} value={col.value}>
                {col.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            value={filterValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={
              selectedFilterColumn
                ? `Filtrar ${selectedFilterLabel}...`
                : "Seleccionar una columna primero"
            }
            disabled={!selectedFilterColumn}
            sx={{ flex: 1, maxWidth: 448 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: filterValue ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Limpiar filtro"
                      onClick={clearFilter}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />

          {serverFilterLoading && (
            <div className="flex items-center gap-2">
              <CircularProgress size={16} />
              <Typography variant="body2" color="primary">
                Buscando...
              </Typography>
            </div>
          )}

          {filterValue && !serverFilterLoading && (
            <Typography variant="body2" color="text.secondary">
              Filtrando: <strong>{selectedFilterLabel}</strong> ={" "}
              <strong>"{filterValue}"</strong>
            </Typography>
          )}
        </Paper>
      )}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <TableContainer>
          <MuiTable>
            {showHeader && (
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort =
                        header.column.getCanSort() && enableSorting;
                      const sorted = header.column.getIsSorted();
                      const content = flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      );
                      return (
                        <TableCell
                          key={header.id}
                          align="center"
                          sortDirection={sorted || false}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {canSort ? (
                            <TableSortLabel
                              active={!!sorted}
                              direction={sorted || "asc"}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {content}
                            </TableSortLabel>
                          ) : (
                            content
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHead>
            )}
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow hover>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} align="center">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderExpandedRow && row.getIsExpanded() && (
                      <TableRow>
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          sx={{ bgcolor: "background.default" }}
                        >
                          {renderExpandedRow(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
        {enablePagination && (
          <TablePagination
            component="div"
            count={
              serverPagination
                ? totalRows
                : table.getFilteredRowModel().rows.length
            }
            page={serverPagination ? currentPage : pageIndex}
            rowsPerPage={serverPagination ? pageSize : clientPageSize}
            rowsPerPageOptions={pageSizeOptions}
            onPageChange={(_, page) => {
              if (serverPagination) onPageChange?.(page);
              else table.setPageIndex(page);
            }}
            onRowsPerPageChange={(e) => {
              const newSize = Number(e.target.value);
              if (serverPagination) onPageSizeChange?.(newSize);
              else table.setPageSize(newSize);
            }}
            sx={{ borderTop: 1, borderColor: "divider" }}
          />
        )}
      </Paper>
    </div>
  );
};

export default Table;

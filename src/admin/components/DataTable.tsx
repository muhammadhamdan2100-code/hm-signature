import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Inbox, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  /**
   * Primitive sort key. Required when `accessor` returns React nodes, because a
   * rendered element carries no comparable value.
   */
  sortValue?: (row: T) => string | number;
  className?: string;
}

type SortPrimitive = string | number | boolean;

const isSortPrimitive = (value: unknown): value is SortPrimitive =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

/** Reads the primitive a column sorts by, or null when the value is not comparable. */
const resolveSortKey = <T,>(col: Column<T>, row: T): SortPrimitive | null => {
  if (col.sortValue) {
    const derived = col.sortValue(row);
    return isSortPrimitive(derived) ? derived : null;
  }
  const cell: unknown =
    typeof col.accessor === "function"
      ? col.accessor(row)
      : col.accessor
      ? (row as Record<string, unknown>)[col.accessor as string]
      : null;
  return isSortPrimitive(cell) ? cell : null;
};

/** Compares two sort keys; missing values always sink to the bottom. */
const compareSortKeys = (a: SortPrimitive | null, b: SortPrimitive | null, asc: boolean): number => {
  if (a === null || b === null) {
    if (a === null && b === null) return 0;
    return a === null ? 1 : -1;
  }
  const valA = typeof a === "string" ? a.toLowerCase() : a;
  const valB = typeof b === "string" ? b.toLowerCase() : b;
  if (valA < valB) return asc ? -1 : 1;
  if (valA > valB) return asc ? 1 : -1;
  return 0;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptySubtitle?: string;
  actions?: React.ReactNode;
  filterControls?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  searchPlaceholder = "Search records...",
  emptyMessage = "No records found",
  emptySubtitle = "Try adjusting your search filters or add a new record.",
  actions,
  filterControls,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Search filter
  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(query);
      }),
    [data, searchQuery]
  );

  // A sortable header only works when the column yields comparable primitives.
  const sortableColumns = useMemo(
    () =>
      columns.map((col) => {
        if (!col.sortable) return false;
        if (col.sortValue) return true;
        if (!col.accessor || data.length === 0) return false;
        return data.some((row) => isSortPrimitive(resolveSortKey(col, row)));
      }),
    [columns, data]
  );

  // Sorting
  const sortedData = useMemo(() => {
    const col = sortIndex === null ? undefined : columns[sortIndex];
    if (!col || sortIndex === null) return filteredData;
    return filteredData
      .map((row) => ({ row, key: resolveSortKey(col, row) }))
      .sort((a, b) => compareSortKeys(a.key, b.key, sortAsc))
      .map((entry) => entry.row);
  }, [columns, filteredData, sortAsc, sortIndex]);

  // Pagination (page index clamped to the pages that actually exist)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedData = sortedData.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );

  // Data or filters can shrink the page count mid-session (filterControls,
  // search, row deletes); snap the stored page back into range during render so
  // the table never commits an out-of-range page.
  if (currentPage !== activePage) {
    setCurrentPage(activePage);
  }

  const handleSelectAllOnPage = () => {
    if (!onSelectAll) return;
    const pageIds = paginatedData.map(keyExtractor);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onSelectAll(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      onSelectAll(combined);
    }
  };

  const handleSort = (index: number) => {
    if (!sortableColumns[index]) return;
    if (sortIndex === index) {
      setSortAsc(!sortAsc);
    } else {
      setSortIndex(index);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-navy2/90 rounded-lg border border-gold/20 overflow-hidden shadow-xl">
      {/* Top Filter & Action Bar */}
      <div className="p-4 border-b border-gold/15 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy/40">
        <div className="flex flex-1 items-center space-x-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-navy/80 border border-gold/20 rounded pl-9 pr-4 py-2 text-xs font-sans text-ivory placeholder-muted focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          {filterControls}
        </div>
        {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-navy text-gold uppercase tracking-[1.5px] text-[10px] font-medium border-b border-gold/15">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((item) =>
                        selectedIds.includes(keyExtractor(item))
                      )
                    }
                    onChange={handleSelectAllOnPage}
                    aria-label="Select all rows on this page"
                    className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const canSort = sortableColumns[idx];
                const isSorted = sortIndex === idx && canSort;
                const ariaSort: "ascending" | "descending" | "none" | undefined = !col.sortable
                  ? undefined
                  : isSorted
                  ? sortAsc
                    ? "ascending"
                    : "descending"
                  : "none";

                const headerLabel = (
                  <>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3 h-3 ${isSorted ? "text-gold" : "text-muted/60"}`}
                      />
                    )}
                  </>
                );

                return (
                  <th
                    key={idx}
                    className={`px-4 py-3.5 ${col.className || ""}`}
                    aria-sort={ariaSort}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(idx)}
                        aria-disabled={canSort ? undefined : true}
                        title={
                          canSort
                            ? `Sort by ${col.header}`
                            : `${col.header} has no sortable value`
                        }
                        className={`flex items-center space-x-1 rounded-sm text-left ${
                          canSort
                            ? "cursor-pointer hover:text-ivory select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                            : "cursor-default"
                        }`}
                      >
                        {headerLabel}
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1">{headerLabel}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/10 text-ivory">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-navy border border-gold/20 text-gold mb-1">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-serif text-base text-ivory font-semibold">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-muted max-w-sm font-light">
                      {emptySubtitle}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    className={`hover:bg-navy/60 transition-colors ${
                      isSelected ? "bg-navy/80" : ""
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow && onSelectRow(id)}
                          aria-label="Select this row"
                          className="rounded border-gold/30 bg-navy text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, idx) => {
                      let cellContent: React.ReactNode = null;
                      if (typeof col.accessor === "function") {
                        cellContent = col.accessor(item);
                      } else if (col.accessor) {
                        cellContent = (item as any)[col.accessor];
                      }

                      return (
                        <td
                          key={idx}
                          className={`px-4 py-3.5 align-middle ${col.className || ""}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-gold/15 bg-navy/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted font-sans">
        <div>
          Showing{" "}
          <span className="text-gold font-medium font-mono num-lining">
            {sortedData.length > 0 ? (activePage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="text-gold font-medium font-mono num-lining">
            {Math.min(activePage * pageSize, sortedData.length)}
          </span>{" "}
          of <span className="text-gold font-medium font-mono num-lining">{sortedData.length}</span> entries
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
            aria-label="Previous page"
            className="p-1.5 rounded border border-gold/20 text-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-mono text-[11px] text-ivory num-lining">
            {activePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            aria-label="Next page"
            className="p-1.5 rounded border border-gold/20 text-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

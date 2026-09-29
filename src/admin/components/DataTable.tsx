import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Inbox, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

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
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(query);
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortIndex === null) return 0;
    const col = columns[sortIndex];
    if (!col || !col.accessor) return 0;

    let valA: any = "";
    let valB: any = "";

    if (typeof col.accessor === "function") {
      valA = col.accessor(a);
      valB = col.accessor(b);
    } else {
      valA = a[col.accessor];
      valB = b[col.accessor];
    }

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
                    className="rounded border-gold/30 bg-navy text-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 ${col.className || ""} ${
                    col.sortable ? "cursor-pointer hover:text-ivory select-none" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(idx)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="w-3 h-3 text-muted/60" />}
                  </div>
                </th>
              ))}
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
                          className="rounded border-gold/30 bg-navy text-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
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
            {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="text-gold font-medium font-mono num-lining">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{" "}
          of <span className="text-gold font-medium font-mono num-lining">{sortedData.length}</span> entries
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-gold/20 text-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-mono text-[11px] text-ivory num-lining">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-gold/20 text-muted hover:text-ivory disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

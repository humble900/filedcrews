import { useState, useMemo, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginatedTableProps {
  children: ReactNode;
  totalItems: number;
  defaultPageSize?: number;
  maxHeight?: string;
  /** If true, skip pagination (e.g. for small tables in dialogs) */
  noPagination?: boolean;
}

/**
 * 2026 Modern Table Wrapper
 * - Hidden scrollbars (horizontal + vertical)
 * - Swipe-friendly horizontal overflow
 * - Contained vertical scroll (max-h)
 * - Pagination bar: 20/50/100/All + prev/next
 * - Modern rounded container styling via .table-container CSS class
 *
 * Usage:
 *   <PaginatedTable totalItems={data.length}>
 *     <Table> ... render only paginatedSlice ... </Table>
 *   </PaginatedTable>
 *
 * The parent must slice its own data using the exported `useTablePage` hook
 * OR use the render-prop version below.
 */
export default function PaginatedTable({
  children,
  totalItems,
  defaultPageSize = 20,
  maxHeight = "55vh",
  noPagination = false,
}: PaginatedTableProps) {
  return (
    <div className="table-container">
      <div
        className="scrollbar-hidden"
        style={{ overflowX: "auto", overflowY: "auto", maxHeight, WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
      {!noPagination && <PaginationBarSlot totalItems={totalItems} defaultPageSize={defaultPageSize} />}
    </div>
  );
}

/* ─── Internal pagination bar (stateless — parent manages actual slicing) ─── */
/* This is exposed separately if the parent needs to control slicing */

interface PaginationBarSlotProps {
  totalItems: number;
  defaultPageSize: number;
}

function PaginationBarSlot({ totalItems }: PaginationBarSlotProps) {
  // This is a placeholder — actual pagination is managed by useTablePage hook in each page
  // The PaginatedTableFull component below handles everything in one place
  if (totalItems <= 0) return null;
  return null; // Actual bar is rendered by PaginatedTableFull
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  PaginatedTableFull — FULL self-contained paginated table wrapper
 *  Pass your data array + a render function and it handles EVERYTHING.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface PaginatedTableFullProps<T> {
  data: T[];
  defaultPageSize?: number;
  maxHeight?: string;
  renderTable: (paginatedData: T[]) => ReactNode;
  noPagination?: boolean;
}

export function PaginatedTableFull<T>({
  data,
  defaultPageSize = 20,
  maxHeight = "55vh",
  renderTable,
  noPagination = false,
}: PaginatedTableFullProps<T>) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = data.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const paginatedData = useMemo(() => {
    if (pageSize === -1) return data;
    const start = safePage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const startIndex = pageSize === -1 ? 0 : safePage * pageSize;
  const endIndex = pageSize === -1 ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  // Reset page when data changes (e.g. filter applied)
  useMemo(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  return (
    <div className="table-container">
      <div
        className="scrollbar-hidden"
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {renderTable(paginatedData)}
      </div>

      {!noPagination && totalItems > 0 && (
        <div className="table-pagination">
          <span className="page-info">
            {pageSize === -1
              ? `Showing all ${totalItems} rows`
              : `${startIndex + 1}\u2013${endIndex} of ${totalItems}`}
          </span>

          <div className="page-controls">
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={-1}>All</option>
            </select>

            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={!canNext}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationBarProps {
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
}

export default function TablePaginationBar({
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPageSizeChange,
}: TablePaginationBarProps) {
  if (totalItems === 0) return null;

  return (
    <div className="table-pagination">
      <span className="page-info">
        {pageSize === -1
          ? `Showing all ${totalItems} rows`
          : `${startIndex + 1}–${endIndex} of ${totalItems}`}
      </span>

      <div className="page-controls">
        <select
          className="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
          <option value={-1}>All</option>
        </select>

        <button
          className="page-btn"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          className="page-btn"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

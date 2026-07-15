import { useState, useMemo } from "react";

interface UseTablePaginationOptions {
  defaultPageSize?: number;
}

export function useTablePagination<T>(
  data: T[],
  options: UseTablePaginationOptions = {}
) {
  const { defaultPageSize = 20 } = options;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = data.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset page if data shrinks (e.g. after filter)
  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) setPage(safePage);

  const paginatedData = useMemo(() => {
    if (pageSize === -1) return data; // Show all
    const start = safePage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const startIndex = pageSize === -1 ? 0 : safePage * pageSize;
  const endIndex = pageSize === -1 ? totalItems : Math.min(startIndex + pageSize, totalItems);

  return {
    paginatedData,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(0); // Reset to first page on size change
    },
    canPrev: safePage > 0,
    canNext: safePage < totalPages - 1,
    goNext: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    goPrev: () => setPage((p) => Math.max(p - 1, 0)),
  };
}

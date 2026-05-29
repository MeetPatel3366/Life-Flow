import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, totalCount, hasNextPage, hasPrevPage } = pagination;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-surface-500">
        Showing page <span className="font-medium text-surface-700">{currentPage}</span> of{" "}
        <span className="font-medium text-surface-700">{totalPages}</span>{" "}
        <span className="hidden sm:inline">({totalCount} total)</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPage === page
                  ? "bg-primary-600 text-white"
                  : "hover:bg-surface-100 text-surface-600"
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
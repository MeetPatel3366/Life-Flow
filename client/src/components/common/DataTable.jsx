import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";

export default function DataTable({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  onRowClick,
  emptyTitle,
  emptyMessage,
}) {
  if (isLoading) {
    return <Spinner size="lg" className="py-20" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle || "No records found"} message={emptyMessage} />;
  }

  console.log("data : ",data);
  

  return (
    <div className="animate-fade-in">
      <div className="overflow-x-auto rounded-xl border border-surface-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {data?.map((row, idx) => (
              <tr
                key={row._id || idx}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-surface-50/50 transition-colors ${onRowClick ? "cursor-pointer" : ""
                  }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-surface-700 whitespace-nowrap">
                    {col.render
                      ? col.render(row[col.key], row)
                      : col.key === "status"
                        ? <StatusBadge status={row[col.key]} />
                        : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}
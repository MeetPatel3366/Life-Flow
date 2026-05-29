import { HiInboxIn } from "react-icons/hi";

export default function EmptyState({ title = "No data found", message = "", icon: Icon = HiInboxIn, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-8 h-8 text-surface-400" /> : <HiInboxIn className="w-8 h-8 text-surface-400" />}
      </div>
      <h3 className="text-lg font-medium text-surface-700">{title}</h3>
      {message && <p className="text-sm text-surface-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

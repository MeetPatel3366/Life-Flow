export default function StatsCard({ title, value, icon: Icon, color = "primary", subtitle }) {
  const colors = {
    primary: "from-primary-500 to-primary-600",
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    pink: "from-pink-500 to-pink-600",
    cyan: "from-cyan-500 to-cyan-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div className="bg-white rounded-xl border border-surface-100 p-5 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value ?? "—"}</p>
          {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

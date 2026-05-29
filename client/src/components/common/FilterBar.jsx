import { useState, useEffect } from "react";
import Select from "../ui/Select";
import { HiSearch, HiX } from "react-icons/hi";

export default function FilterBar({ filters, values, onChange, searchPlaceholder, className = "" }) {
  const [searchInput, setSearchInput] = useState(values.search || "");

  useEffect(() => {
    if (!searchPlaceholder) return;
    const timer = setTimeout(() => {
      if (searchInput !== (values.search || "")) {
        onChange("search", searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(values.search || "");
  }, [values.search]);

  return (
    <div className={`flex flex-wrap items-end gap-3 w-full ${className}`}>
      {searchPlaceholder && (
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-8 py-2 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[150px]">
          <Select
            label={filter.label}
            placeholder={`All ${filter.label}`}
            options={filter.options}
            value={values[filter.key] || ""}
            onChange={(e) => onChange(filter.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
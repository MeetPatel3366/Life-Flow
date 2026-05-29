import { forwardRef } from "react";

const Select = forwardRef(
  ({ label, error, options = [], placeholder, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 ${
            error ? "border-red-400" : ""
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
              {typeof opt === "string" ? opt : opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;

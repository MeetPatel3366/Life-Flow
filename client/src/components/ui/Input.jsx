import { forwardRef } from "react";

const Input = forwardRef(
  ({ label, error, icon: Icon, className = "", type = "text", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-4 w-4 text-surface-400" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 ${
              Icon ? "pl-9" : ""
            } ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
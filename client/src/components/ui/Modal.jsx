import { useEffect } from "react";
import { HiX } from "react-icons/hi";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto animate-fade-in`}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer"
          >
            <HiX className="w-5 h-5 text-surface-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

import Button from "../ui/Button";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
        <p className="text-sm text-surface-500 mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

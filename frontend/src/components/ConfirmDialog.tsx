import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-lg border-4 border-black bg-white p-6 shadow-lg text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        style={{ backgroundColor: "#fff" }}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-black">
          {title}
        </h2>
        <p className="text-black/80 mt-2 text-sm">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant={variant === "danger" ? "destructive" : "default"}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

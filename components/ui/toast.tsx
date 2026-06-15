"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useEffect } from "react";
import { useUiStore, type ToastMessage } from "@/store/ui-store";

// Helper object for simple triggering
export const toast = {
  success: (message: string, duration = 3000) => {
    useUiStore.getState().addToast({ type: "success", message, duration });
  },
  error: (message: string, duration = 4000) => {
    useUiStore.getState().addToast({ type: "error", message, duration });
  },
  info: (message: string, duration = 3000) => {
    useUiStore.getState().addToast({ type: "info", message, duration });
  },
  warning: (message: string, duration = 3000) => {
    useUiStore.getState().addToast({ type: "warning", message, duration });
  },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const removeToast = useUiStore((state) => state.removeToast);
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
  };

  const bgStyles = {
    success: "bg-surface border-emerald-500/20 shadow-emerald-500/5",
    error: "bg-surface border-rose-500/20 shadow-rose-500/5",
    info: "bg-surface border-blue-500/20 shadow-blue-500/5",
    warning: "bg-surface border-amber-500/20 shadow-amber-500/5",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex items-start gap-3 w-80 sm:w-96 p-4 rounded-xl border bg-opacity-95 backdrop-blur-md shadow-lg pointer-events-auto ${bgStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium text-text-primary leading-tight pt-0.5">
        {toast.message}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-text-muted hover:text-text-primary subtle-hover rounded-md p-0.5 hover:bg-hover shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[var(--z-overlay)] flex flex-col gap-3 pointer-events-none select-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

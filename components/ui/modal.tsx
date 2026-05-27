"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/use-focus-trap";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  const trapRef = useFocusTrap(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-overlay p-6"
          onClick={onClose}
        >
          <motion.div
            ref={trapRef}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-[var(--z-modal)] w-full max-w-2xl rounded-[var(--radius-modal)] border border-border-soft bg-surface shadow-floating"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border-soft px-6 py-5">
              <div>
                <h2 className="text-section-title font-secondary text-text-primary">{title}</h2>
                {description && <p className="mt-1 text-body text-text-muted">{description}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

type DrawerProps = {
  open: boolean;
  title: string;
  side?: "left" | "right";
  onClose: () => void;
  children: React.ReactNode;
};

export function Drawer({ open, title, side = "right", onClose, children }: DrawerProps) {
  const trapRef = useFocusTrap(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-overlay"
          onClick={onClose}
        >
          <motion.aside
            ref={trapRef}
            initial={{ x: side === "right" ? 320 : -320 }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? 320 : -320 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "absolute top-0 z-[var(--z-modal)] flex h-full w-full max-w-md flex-col border-border-soft bg-surface shadow-floating",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-6 py-5">
              <h2 className="text-section-title font-secondary text-text-primary">{title}</h2>
              <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close drawer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

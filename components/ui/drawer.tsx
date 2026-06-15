"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

type DrawerProps = {
  open: boolean;
  title: string;
  side?: "left" | "right";
  size?: "md" | "lg" | "xl";
  onClose: () => void;
  children: React.ReactNode;
};

export function Drawer({ open, title, side = "right", size = "md", onClose, children }: DrawerProps) {
  const trapRef = useFocusTrap(open, onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const scrollRoot = document.querySelector(".scroll-root") as HTMLElement;
    if (open) {
      document.body.style.overflow = "hidden";
      if (scrollRoot) {
        scrollRoot.style.overflow = "hidden";
      }
    }
    return () => {
      document.body.style.overflow = "";
      if (scrollRoot) {
        scrollRoot.style.overflow = "";
      }
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeInOut" }}
          className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-[1px]"
          onClick={onClose}
        >
          <motion.aside
            ref={trapRef}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed top-0 bottom-0 z-[var(--z-modal)] flex h-full w-full flex-col border-border-soft bg-surface shadow-floating",
              size === "md" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-5xl",
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

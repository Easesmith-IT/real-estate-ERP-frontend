"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File | null) => void;
  className?: string;
};

export function FileUpload({ accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.txt", maxSizeMB = 10, onFileSelect, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      onFileSelect(null);
      return;
    }
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit`);
      setFile(null);
      onFileSelect(null);
      return;
    }
    setFile(selected);
    onFileSelect(selected);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleSelect(e.dataTransfer.files[0] || null);
        }}
        className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border-soft bg-surface px-4 py-6 transition-colors hover:border-accent-primary/40 hover:bg-hover"
      >
        {file ? (
          <>
            <FileText className="h-8 w-8 shrink-0 text-accent-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium text-text-primary">{file.name}</p>
              <p className="text-label text-text-muted">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleSelect(null); if (inputRef.current) inputRef.current.value = ""; }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 shrink-0 text-text-muted" />
            <div>
              <p className="text-body font-medium text-text-primary">Drop a file here or click to browse</p>
              <p className="text-label text-text-muted">PDF, images, docs up to {maxSizeMB}MB</p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0] || null)}
      />
      {error && <p className="text-label text-error">{error}</p>}
    </div>
  );
}

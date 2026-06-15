"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileUp, FolderKanban, Info, Layers3, UserRound } from "lucide-react";
import { uploadDocument, apiRequest } from "@/lib/erp-api";
import type { DocumentRecord } from "@/lib/erp-types";
import type { UserRole } from "@/types/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

const categoryOptions = [
  "Drawings",
  "Contracts",
  "Permits",
  "Reports",
  "Material Tests",
  "Invoices",
  "Photos",
  "Other",
];

const moduleOptions = [
  "Projects",
  "Compliance",
  "Approvals",
  "Reports",
  "Contracts",
  "Bookings",
];

const statusOptions = ["Pending Review", "Approved", "Rejected", "Expired"];

type ProjectOption = {
  id: string;
  name: string;
};

type OwnerOption = {
  id: string;
  name: string;
};

type DrawerDefaults = Partial<{
  title: string;
  category: string;
  module: string;
  projectId: string;
  version: string;
  status: string;
  expiryDate: string;
  ownerId: string;
}>;

type ProjectDocumentUploadDrawerProps = {
  open: boolean;
  onClose: () => void;
  role: UserRole;
  projects: ProjectOption[];
  owners: OwnerOption[];
  title?: string;
  helperText?: string;
  submitLabel?: string;
  defaults?: DrawerDefaults;
  onCreated?: (document: DocumentRecord) => void;
};

function getInitialState(defaults: DrawerDefaults | undefined, owners: OwnerOption[]) {
  return {
    title: defaults?.title || "",
    category: defaults?.category || "Contracts",
    module: defaults?.module || "Projects",
    projectId: defaults?.projectId || "",
    version: defaults?.version || "v1",
    status: defaults?.status || "Pending Review",
    expiryDate: defaults?.expiryDate || "",
    ownerId: defaults?.ownerId || owners[0]?.id || "",
  };
}

export function ProjectDocumentUploadDrawer({
  open,
  onClose,
  role,
  projects,
  owners,
  title = "Upload Document",
  helperText,
  submitLabel = "Save Document",
  defaults,
  onCreated,
}: ProjectDocumentUploadDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(() => getInitialState(defaults, owners));

  const selectedProjectName = projects.find((project) => project.id === form.projectId)?.name || "General / Cross-project";

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) {
        throw new Error("Document title is required.");
      }

      if (!form.category.trim() || !form.module.trim()) {
        throw new Error("Category and module are required.");
      }

      const payload = {
        title: form.title.trim(),
        category: form.category,
        module: form.module,
        projectId: form.projectId || undefined,
        version: form.version.trim() || "v1",
        status: form.status,
        expiryDate: form.expiryDate || undefined,
        ownerId: form.ownerId || owners[0]?.id,
      };

      if (selectedFile) {
        return uploadDocument(role, selectedFile, {
          ...payload,
          projectId: payload.projectId || "",
          expiryDate: payload.expiryDate || "",
          ownerId: payload.ownerId || "",
        });
      }

      return apiRequest<DocumentRecord>("/api/admin/documents", {
        role,
        method: "POST",
        body: payload,
      });
    },
    onSuccess: async (response) => {
      const document = response.data;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-compliance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
      ]);
      onClose();
      onCreated?.(document);
    },
    onError: (error: Error) => {
      setFormError(error.message || "Unable to save document.");
    },
  });

  return (
    <Drawer open={open} onClose={onClose} title={title} size="xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          createMutation.mutate();
        }}
        className="space-y-6 pb-10"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Right Drawer · XL</Badge>
          <Badge tone="neutral">{selectedProjectName}</Badge>
          <Badge tone="neutral">{form.version || "v1"}</Badge>
        </div>

        {helperText ? (
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/35 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-primary" />
              <p className="text-body text-text-secondary">{helperText}</p>
            </div>
          </div>
        ) : null}

        {formError ? (
          <div className="rounded-[var(--radius-card)] border border-error/20 bg-error/5 p-4 text-body text-error">
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileUp className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-body font-semibold text-text-primary">Document payload</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-label text-text-secondary">Document title</label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="e.g. Tower A structural drawing revision"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Category</label>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className={selectClassName}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Module</label>
                  <select
                    value={form.module}
                    onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
                    className={selectClassName}
                  >
                    {moduleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Version</label>
                  <Input
                    value={form.version}
                    onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                    placeholder="v1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Workflow status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className={selectClassName}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-label text-text-secondary">File attachment</label>
                  <div className="rounded-[var(--radius-input)] border border-dashed border-border-soft bg-surface p-4">
                    <Input
                      type="file"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                      className="h-auto border-none bg-transparent px-0 shadow-none focus-visible:shadow-none"
                    />
                    <p className="mt-2 text-label text-text-muted">
                      File is optional. You can keep a document record without a physical attachment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FolderKanban className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-body font-semibold text-text-primary">Project linkage</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Project</label>
                  <select
                    value={form.projectId}
                    onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
                    className={selectClassName}
                  >
                    <option value="">General / Cross-project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary">Owner</label>
                  <select
                    value={form.ownerId}
                    onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))}
                    className={selectClassName}
                  >
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-label text-text-secondary">Expiry date</label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers3 className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-body font-semibold text-text-primary">Publishing summary</h3>
              </div>
              <div className="space-y-3 text-body text-text-secondary">
                <p>
                  <span className="font-medium text-text-primary">Category:</span> {form.category}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Module:</span> {form.module}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Project:</span> {selectedProjectName}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Version:</span> {form.version || "v1"}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Attachment:</span>{" "}
                  {selectedFile ? selectedFile.name : "Record only"}
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-body font-semibold text-text-primary">Publishing guidance</h3>
              </div>
              <ul className="space-y-2 text-body text-text-secondary">
                <li>Use project-level records for documents tied to coverage scoring and compliance readiness.</li>
                <li>Use status and expiry to surface pending review, expiring approvals, and risk signals.</li>
                <li>Publish a new version instead of overwriting the prior issue when revision control matters.</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 text-accent-primary" />
                <h3 className="text-body font-semibold text-text-primary">Workflow note</h3>
              </div>
              <p className="text-body text-text-secondary">
                This drawer keeps the existing document record flow intact while removing the inline form from the main intelligence page.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border-soft bg-surface pt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending} className="text-white">
            <FileUp className="h-4 w-4" />
            {submitLabel}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  listViewerTargetCandidatesAction,
  setViewerTargetsAction,
  type AdminTargetCandidate,
  type AdminUserSummary,
} from "@/lib/actions/admin";

type ManageViewerAccessDialogProps = {
  viewer: AdminUserSummary | null;
  onClose: () => void;
  onError: (msg: string | null) => void;
};

export function ManageViewerAccessDialog({
  viewer,
  onClose,
  onError,
}: ManageViewerAccessDialogProps) {
  const [pending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<AdminTargetCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewer) return;
    setLocalError(null);
    setLoading(true);
    setSelected(new Set(viewer.viewerTargets.map((t) => t.id)));
    listViewerTargetCandidatesAction()
      .then((list) => setCandidates(list))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [viewer]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (!viewer) return;
    setLocalError(null);
    onError(null);
    if (selected.size === 0) {
      setLocalError("A viewer must have at least one user assigned.");
      return;
    }
    startTransition(async () => {
      const result = await setViewerTargetsAction(viewer.id, [...selected]);
      if (!result.ok) {
        const message = result.error ?? "Failed to update access.";
        setLocalError(message);
        toast.error(message);
        return;
      }
      toast.success(`Access updated for ${viewer.username}`);
      onClose();
    });
  }

  return (
    <Dialog
      open={viewer !== null}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setLocalError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Manage viewer access{viewer ? ` for ${viewer.username}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Users this viewer can see</Label>
          {loading ? (
            <p className="text-xs text-neutral-500">Loading users…</p>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-red-600">
              No trackable users exist yet.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-2">
              {candidates.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50"
                      data-testid={`manage-target-option-${c.username}`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-violet-600"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                      />
                      <span className="text-sm text-neutral-800">
                        {c.name}{" "}
                        <span className="text-neutral-500">
                          (@{c.username})
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {localError && (
            <p
              className="text-sm text-red-600"
              data-testid="manage-access-error"
            >
              {localError}
            </p>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending || loading}
            className="w-full"
            data-testid="manage-access-save"
          >
            {pending ? "Saving…" : "Save access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUserAction,
  listViewerTargetCandidatesAction,
  type AdminTargetCandidate,
} from "@/lib/actions/admin";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CreateRole = "user" | "viewer";

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<CreateRole>("user");
  const [candidates, setCandidates] = useState<AdminTargetCandidate[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingCandidates(true);
    listViewerTargetCandidatesAction()
      .then((list) => setCandidates(list))
      .catch(() => setCandidates([]))
      .finally(() => setLoadingCandidates(false));
  }, [open]);

  function toggleTarget(id: string) {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const username = String(formData.get("username") ?? "")
      .trim()
      .toLowerCase();

    if (role === "viewer") {
      formData.delete("targetUserIds");
      for (const id of selectedTargets) {
        formData.append("targetUserIds", id);
      }
      if (selectedTargets.size === 0) {
        setError("Pick at least one user the viewer is allowed to see.");
        return;
      }
    }
    formData.set("role", role);

    startTransition(async () => {
      const result = await createUserAction(formData);
      if (!result.ok) {
        const message = result.error ?? "Failed to create user.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(
        role === "viewer"
          ? `Viewer "${username}" created`
          : `User "${username}" created`,
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setError(null);
          setRole("user");
          setSelectedTargets(new Set());
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new user</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Account type</Label>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Account type"
            >
              <RoleButton
                active={role === "user"}
                onClick={() => setRole("user")}
                testId="new-role-user"
                label="Regular user"
                hint="Tracks their own weight"
              />
              <RoleButton
                active={role === "viewer"}
                onClick={() => setRole("viewer")}
                testId="new-role-viewer"
                label="Viewer"
                hint="Read-only access to others"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-name">Display name</Label>
            <Input
              id="new-name"
              name="name"
              type="text"
              required
              autoComplete="off"
              maxLength={80}
              data-testid="new-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              name="username"
              type="text"
              required
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9._\-]+"
              data-testid="new-username-input"
            />
            <p className="text-xs text-neutral-500">
              Lowercase, letters/digits/._-, 3–32 chars.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={4}
              autoComplete="new-password"
              data-testid="new-password-input"
            />
            <p className="text-xs text-neutral-500">Minimum 4 characters.</p>
          </div>

          {role === "viewer" && (
            <div className="space-y-2" data-testid="viewer-targets-section">
              <Label>Which users can this viewer see?</Label>
              {loadingCandidates ? (
                <p className="text-xs text-neutral-500">Loading users…</p>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-red-600">
                  No trackable users exist yet — create a regular user first.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-2">
                  {candidates.map((c) => {
                    const checked = selectedTargets.has(c.id);
                    return (
                      <li key={c.id}>
                        <label
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50"
                          data-testid={`viewer-target-option-${c.username}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-violet-600"
                            checked={checked}
                            onChange={() => toggleTarget(c.id)}
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
              <p className="text-xs text-neutral-500">
                Tip: pick one for a direct dashboard, or several to give the
                viewer a chooser screen.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" data-testid="create-user-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="w-full"
            data-testid="create-user-submit"
          >
            {pending ? "Creating…" : "Create user"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleButton({
  active,
  onClick,
  label,
  hint,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={
        "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors " +
        (active
          ? "border-violet-600 bg-violet-50 text-violet-900"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300")
      }
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-neutral-500">{hint}</span>
    </button>
  );
}

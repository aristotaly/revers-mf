"use client";

import { useState, useTransition } from "react";
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
import { createUserAction } from "@/lib/actions/admin";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const username = String(formData.get("username") ?? "")
      .trim()
      .toLowerCase();

    startTransition(async () => {
      const result = await createUserAction(formData);
      if (!result.ok) {
        const message = result.error ?? "Failed to create user.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(`User "${username}" created`);
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new user</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
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

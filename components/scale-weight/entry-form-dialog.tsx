"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertWeightEntry } from "@/lib/actions/weight-entries";

type EntryFormDialogProps = {
  trigger?: React.ReactNode;
  initial?: {
    weight?: number;
    date: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EntryFormDialog({
  trigger,
  initial,
  open: controlledOpen,
  onOpenChange,
}: EntryFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => onOpenChange?.(v)
    : setInternalOpen;

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await upsertWeightEntry(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  const dateValue = initial?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial?.weight != null ? "Edit Weight" : "Add Weight"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={initial?.weight}
              key={`weight-${dateValue}-${initial?.weight ?? "new"}`}
              data-testid="weight-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={dateValue}
              readOnly={isControlled}
              data-testid="date-input"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" data-testid="save-entry">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

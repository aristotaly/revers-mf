"use client";

import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { EntryFormDialog } from "./entry-form-dialog";
import { EntryList, type ScaleEntry } from "./entry-list";

export function ScaleWeightPageClient({ entries }: { entries: ScaleEntry[] }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader
        title="Scale Weight"
        backHref="/dashboard"
        rightAction={
          <EntryFormDialog
            trigger={
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center text-neutral-900"
                aria-label="Add entry"
                data-testid="add-entry-button"
              >
                <Plus className="h-5 w-5" strokeWidth={1.5} />
              </button>
            }
          />
        }
      />
      <div className="py-4">
        <EntryList entries={entries} />
      </div>
    </div>
  );
}

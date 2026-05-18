"use client";

import { Pencil } from "lucide-react";
import { formatDisplayDate } from "@/utils/analytics";
import { EntryFormDialog } from "./entry-form-dialog";

export type ScaleEntry = {
  id: string;
  date: Date;
  weight: number;
};

export function EntryList({ entries }: { entries: ScaleEntry[] }) {
  return (
    <ul className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4 last:border-0"
          data-testid={`entry-${entry.id}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
            MF
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-neutral-900">
              {entry.weight.toFixed(1)} kg
            </p>
            <p className="text-sm text-neutral-500">
              {formatDisplayDate(entry.date)}
            </p>
          </div>
          <EntryFormDialog
            initial={{
              weight: entry.weight,
              date: entry.date.toISOString().slice(0, 10),
            }}
            trigger={
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
                aria-label="Edit entry"
              >
                <Pencil className="h-4 w-4" />
              </button>
            }
          />
        </li>
      ))}
    </ul>
  );
}

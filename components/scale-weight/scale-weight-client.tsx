"use client";

import { useState } from "react";
import { AppHeader, HeaderAddButton } from "@/components/layout/app-header";
import { EntryFormDialog } from "./entry-form-dialog";
import { EntryList, type ScaleEntry } from "./entry-list";

export function ScaleWeightClient({ entries }: { entries: ScaleEntry[] }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
  <>
    <AppHeader
      title="Scale Weight"
      backHref="/dashboard"
      rightAction={
        <EntryFormDialog
          trigger={<HeaderAddButton onClick={() => setAddOpen(true)} />}
        />
      }
    />
    <div className="py-4">
      <EntryList entries={entries} />
    </div>
  </>
  );
}
